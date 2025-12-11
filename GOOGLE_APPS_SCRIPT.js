/**
 * ==========================================
 * CARTOGRAFÍA SOCIAL - BACKEND SCRIPT
 * ==========================================
 * Copia y pega este código en: extensions > Apps Script
 * dentro de tu Google Sheet.
 * 
 * HOJAS REQUERIDAS:
 * 1. "POLIGONOS"
 * 2. "HOGARES" (Se crea automáticamente con la estructura solicitada)
 */

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
    // ACCIONES DE POLÍGONOS (ÁREAS)
    // =========================================================
    if (action === "listar") {
      var sheet = getOrCreateSheet(ss, "POLIGONOS");
      result = getSheetData(sheet);
    
    } else if (action === "crear") {
      var sheet = getOrCreateSheet(ss, "POLIGONOS");
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
      var sheet = getOrCreateSheet(ss, "POLIGONOS");
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
    // ACCIONES DE HOGARES (CENSO)
    // =========================================================
    } else if (action === "listar_hogares") {
      var sheet = getOrCreateSheet(ss, "HOGARES");
      result = getSheetData(sheet);

    } else if (action === "registrar_hogar") {
      var sheet = getOrCreateSheet(ss, "HOGARES");
      // Orden solicitado estrictamente: 
      // ID_HOGAR, FECHA_CENSO, USUARIO_APP, ESTDO, MUNICIPIO, PARROQUIA, 
      // COMUNIDAD, COORDENADA_LAT, COORDENADA_LONG, DIRECCION_REF, 
      // NOMBRE_JEFE_FAMILIA, NUM_MIEMBROS, TIPO_VIVIENDA
      sheet.appendRow([
        params.ID_HOGAR,
        params.FECHA_CENSO || new Date().toISOString(),
        params.USUARIO_APP,
        params.ESTDO || params.ESTADO, // Soporta ambos por si acaso
        params.MUNICIPIO,
        params.PARROQUIA,
        params.COMUNIDAD,
        params.COORDENADA_LAT,
        params.COORDENADA_LONG,
        params.DIRECCION_REF,
        params.NOMBRE_JEFE_FAMILIA,
        params.NUM_MIEMBROS,
        params.TIPO_VIVIENDA
      ]);
      result = { success: true, message: "Hogar registrado" };

    // =========================================================
    // ESTADÍSTICAS (INTEGRADO)
    // =========================================================
    } else if (action === "stats") {
      var stats = {};

      // 1. Procesar Polígonos para estructura base
      var polySheet = ss.getSheetByName("POLIGONOS");
      if (polySheet) {
        var polyData = polySheet.getDataRange().getValues();
        for (var i = 1; i < polyData.length; i++) {
          var comm = polyData[i][1]; // COMUNIDAD_ASOCIADA
          if (!comm) continue;
          
          if (!stats[comm]) {
            stats[comm] = { 
              name: comm, 
              families: 0, 
              population: 0, 
              areas: 0,
              state: polyData[i][7],
              municipality: polyData[i][8],
              parish: polyData[i][9]
            };
          }
          stats[comm].areas += 1;
        }
      }

      // 2. Procesar Hogares para datos demográficos reales
      var homeSheet = ss.getSheetByName("HOGARES");
      if (homeSheet) {
        var homeData = homeSheet.getDataRange().getValues();
        // Indices basados en el orden de creación (ver getOrCreateSheet)
        // 0:ID_HOGAR, 1:FECHA_CENSO, 2:USUARIO_APP, 3:ESTDO, 4:MUNICIPIO, 5:PARROQUIA, 
        // 6:COMUNIDAD, 7:LAT, 8:LONG, 9:DIR, 10:JEFE, 11:MIEMBROS, 12:TIPO
        
        for (var i = 1; i < homeData.length; i++) {
          var comm = homeData[i][6];
          var members = parseInt(homeData[i][11]) || 0;

          if (comm) {
             if (!stats[comm]) {
               // Si la comunidad tiene censo pero no polígono
               stats[comm] = {
                 name: comm,
                 families: 0,
                 population: 0,
                 areas: 0,
                 state: homeData[i][3], // Columna ESTDO
                 municipality: homeData[i][4],
                 parish: homeData[i][5]
               };
             }
             stats[comm].families += 1; // 1 Fila = 1 Hogar
             stats[comm].population += members;
          }
        }
      } else {
        // Fallback demo solo si NO existe la hoja de hogares (inicio del proyecto)
        if (polySheet) {
           for (var key in stats) {
             stats[key].families = 15 * stats[key].areas; // Estimación dummy
             stats[key].population = 45 * stats[key].areas;
           }
        }
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

// Helpers
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === "POLIGONOS") {
      sheet.appendRow(["ID_AREA", "COMUNIDAD_ASOCIADA", "TIPO_AREA", "NOMBRE_AREA", "GEOMETRIA_WKT", "FECHA_ACTUALIZACION", "USUARIO_WKT", "ESTADO", "MUNICIPIO", "PARROQUIA"]);
    } else if (name === "HOGARES") {
      // Estructura solicitada
      sheet.appendRow([
        "ID_HOGAR", 
        "FECHA_CENSO", 
        "USUARIO_APP", 
        "ESTDO", 
        "MUNICIPIO", 
        "PARROQUIA", 
        "COMUNIDAD", 
        "COORDENADA_LAT", 
        "COORDENADA_LONG", 
        "DIRECCION_REF", 
        "NOMBRE_JEFE_FAMILIA", 
        "NUM_MIEMBROS", 
        "TIPO_VIVIENDA"
      ]);
    }
  }
  return sheet;
}

function getSheetData(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
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