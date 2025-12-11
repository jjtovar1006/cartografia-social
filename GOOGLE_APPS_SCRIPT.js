/**
 * ==========================================
 * CARTOGRAFÍA SOCIAL - BACKEND SCRIPT (V3 ROBUSTO)
 * ==========================================
 * - Normaliza nombres de columnas (quita espacios y pone mayúsculas).
 * - Maneja errores de datos vacíos.
 */

// CONFIGURACIÓN DE NOMBRES DE HOJAS
const SHEET_AREAS = "CARTOGRAFIA_AREAS";
const SHEET_HOGARES = "CENSO_HOGARES";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var params = e.parameter;
    var postData = e.postData ? JSON.parse(e.postData.contents) : {};
    
    // Unificar parámetros
    for (var key in postData) {
      params[key] = postData[key];
    }

    var action = params.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {};

    // =========================================================
    // ACCIONES DE POLÍGONOS (CARTOGRAFIA_AREAS)
    // =========================================================
    if (action === "listar") {
      var sheet = getOrCreateSheet(ss, SHEET_AREAS);
      result = getSheetData(sheet);
    
    } else if (action === "crear") {
      var sheet = getOrCreateSheet(ss, SHEET_AREAS);
      sheet.appendRow([
        params.ID_AREA,
        params.COMUNIDAD_ASOCIADA,
        params.TIPO_AREA,
        params.NOMBRE_AREA,
        params.GEOMETRIA_WKT,
        new Date().toISOString(),
        params.USUARIO_WKT,
        params.ESTADO || "",
        params.MUNICIPIO || "",
        params.PARROQUIA || ""
      ]);
      result = { success: true, message: "Área creada" };

    } else if (action === "actualizar") {
      var sheet = getOrCreateSheet(ss, SHEET_AREAS);
      updateRowById(sheet, params.ID_AREA, [
        params.ID_AREA,
        params.COMUNIDAD_ASOCIADA,
        params.TIPO_AREA,
        params.NOMBRE_AREA,
        params.GEOMETRIA_WKT,
        new Date().toISOString(),
        params.USUARIO_WKT,
        params.ESTADO || "",
        params.MUNICIPIO || "",
        params.PARROQUIA || ""
      ]);
      result = { success: true, message: "Área actualizada" };

    // =========================================================
    // ACCIONES DE HOGARES (CENSO_HOGARES)
    // =========================================================
    } else if (action === "listar_hogares") {
      var sheet = getOrCreateSheet(ss, SHEET_HOGARES);
      var rawData = getSheetData(sheet);
      
      // Separar lat/lng para que el mapa lo entienda
      result = rawData.map(function(row) {
        var lat = 0;
        var lng = 0;
        
        // Buscar columna COORDENADAS (normalizada)
        var coords = row['COORDENADAS'];
        
        if (coords) {
          var parts = coords.toString().split(',');
          if (parts.length >= 2) {
             lat = parseFloat(parts[0].trim());
             lng = parseFloat(parts[1].trim());
          }
        } 
        
        // Asignar al objeto de respuesta
        row['COORDENADA_LAT'] = lat;
        row['COORDENADA_LONG'] = lng;
        return row;
      });

    } else if (action === "registrar_hogar") {
      var sheet = getOrCreateSheet(ss, SHEET_HOGARES);
      var coordsString = params.COORDENADA_LAT + ", " + params.COORDENADA_LONG;

      // Nota: Aquí asumimos el orden de columnas fijo para escritura
      sheet.appendRow([
        params.ID_HOGAR,
        params.FECHA_CENSO || new Date().toISOString(),
        params.USUARIO_APP,
        params.ESTADO,
        params.MUNICIPIO,
        params.PARROQUIA,
        params.COMUNIDAD,
        coordsString,
        params.DIRECCION_REF,
        params.NOMBRE_JEFE_FAMILIA,
        params.NUM_MIEMBROS,
        params.TIPO_VIVIENDA
      ]);
      result = { success: true, message: "Hogar registrado" };

    // =========================================================
    // ESTADÍSTICAS (PARA LOS FILTROS DEL DASHBOARD)
    // =========================================================
    } else if (action === "stats") {
      var stats = {};

      // 1. Leer Hogares (Fuente principal de demografía y UBICACIÓN)
      var homeSheet = ss.getSheetByName(SHEET_HOGARES);
      if (homeSheet) {
        var homeData = getSheetData(homeSheet);
        
        homeData.forEach(function(row) {
           // Usamos claves normalizadas (Mayúsculas)
           var comm = row['COMUNIDAD']; 
           if (!comm) return;

           // Normalizar nombre de comunidad para evitar duplicados por espacios
           comm = comm.toString().trim();

           if (!stats[comm]) {
             stats[comm] = {
                name: comm,
                families: 0,
                population: 0,
                areas: 0,
                // Asegurar que leemos las columnas políticas correctamente
                state: (row['ESTADO'] || "").toString().trim(),
                municipality: (row['MUNICIPIO'] || "").toString().trim(),
                parish: (row['PARROQUIA'] || "").toString().trim()
             };
           }
           
           stats[comm].families += 1;
           stats[comm].population += (parseInt(row['NUM_MIEMBROS']) || 0);
        });
      }

      // 2. Leer Polígonos (para saber si ya están dibujados)
      var polySheet = ss.getSheetByName(SHEET_AREAS);
      if (polySheet) {
        var polyData = getSheetData(polySheet);
        polyData.forEach(function(row) {
           var comm = row['COMUNIDAD_ASOCIADA'];
           if (!comm) return;
           comm = comm.toString().trim();

           if (stats[comm]) {
             stats[comm].areas += 1;
           } else {
             // Si existe el polígono pero no hay censo aún, lo agregamos también
             stats[comm] = {
                name: comm,
                families: 0,
                population: 0,
                areas: 1,
                state: (row['ESTADO'] || "").toString().trim(),
                municipality: (row['MUNICIPIO'] || "").toString().trim(),
                parish: (row['PARROQUIA'] || "").toString().trim()
             };
           }
        });
      }

      result = Object.values(stats);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ "error": e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Helpers Genéricos
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// FUNCIÓN CLAVE: Lee datos y NORMALIZA los encabezados a MAYÚSCULAS y SIN ESPACIOS
function getSheetData(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 1) return [];
  
  var headers = data[0];
  // Normalizar headers: "  Estado " -> "ESTADO"
  var cleanHeaders = headers.map(function(h) {
    return h.toString().trim().toUpperCase();
  });

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < cleanHeaders.length; j++) {
      var key = cleanHeaders[j];
      // Solo agregamos si hay clave (evitar columnas vacías)
      if (key) {
        row[key] = data[i][j];
      }
    }
    rows.push(row);
  }
  return rows;
}

function updateRowById(sheet, id, newValues) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      var range = sheet.getRange(i + 1, 1, 1, newValues.length);
      range.setValues([newValues]);
      return true;
    }
  }
  throw new Error("ID no encontrado");
}