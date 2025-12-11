/**
 * ==========================================
 * CARTOGRAFÍA SOCIAL - BACKEND SCRIPT
 * ==========================================
 * Copia y pega este código en: extensions > Apps Script
 * dentro de tu Google Sheet.
 * 
 * Asegúrate de tener una hoja llamada "POLIGONOS" con los encabezados:
 * A1: ID_AREA
 * B1: COMUNIDAD_ASOCIADA
 * C1: TIPO_AREA
 * D1: NOMBRE_AREA
 * E1: GEOMETRIA_WKT
 * F1: FECHA_ACTUALIZACION
 * G1: USUARIO_WKT
 * H1: ESTADO
 * I1: MUNICIPIO
 * J1: PARROQUIA
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
    
    // Unificar parámetros (GET y POST)
    for (var key in postData) {
      params[key] = postData[key];
    }

    var action = params.action;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("POLIGONOS");
    
    if (!sheet) {
      // Auto-crear hoja si no existe
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("POLIGONOS");
      sheet.appendRow(["ID_AREA", "COMUNIDAD_ASOCIADA", "TIPO_AREA", "NOMBRE_AREA", "GEOMETRIA_WKT", "FECHA_ACTUALIZACION", "USUARIO_WKT", "ESTADO", "MUNICIPIO", "PARROQUIA"]);
    }

    var result = {};

    if (action === "listar") {
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
      result = rows;
    
    } else if (action === "stats") {
      // Generar estadísticas agregadas
      var data = sheet.getDataRange().getValues();
      var stats = {}; // { "NombreComunidad": { families: 0, population: 0, areas: 0, ...geo } }
      
      // Empezamos desde fila 1 (datos)
      for (var i = 1; i < data.length; i++) {
        var comm = data[i][1]; // Columna B: COMUNIDAD
        var state = data[i][7]; // Col H
        var muni = data[i][8];  // Col I
        var parish = data[i][9]; // Col J
        
        if (comm) {
          if (!stats[comm]) {
            stats[comm] = { 
              name: comm, 
              families: 0, 
              population: 0, 
              areas: 0,
              state: state,
              municipality: muni,
              parish: parish
            };
          }
          stats[comm].areas += 1;
          // Simulación: Si no hay datos reales de censo, estimamos por área
          stats[comm].families += 15; 
          stats[comm].population += 45;
        }
      }
      result = Object.values(stats);

    } else if (action === "crear") {
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
      var data = sheet.getDataRange().getValues();
      var found = false;
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] == params.ID_AREA) { // ID_AREA en columna A (índice 0)
          // Actualizar columnas. +1 porque getRange usa índice 1-based
          var rowIdx = i + 1;
          
          // Mapeo explícito de columnas
          sheet.getRange(rowIdx, 2).setValue(params.COMUNIDAD_ASOCIADA);
          sheet.getRange(rowIdx, 3).setValue(params.TIPO_AREA);
          sheet.getRange(rowIdx, 4).setValue(params.NOMBRE_AREA);
          sheet.getRange(rowIdx, 5).setValue(params.GEOMETRIA_WKT);
          sheet.getRange(rowIdx, 6).setValue(new Date().toISOString());
          sheet.getRange(rowIdx, 7).setValue(params.USUARIO_WKT);
          sheet.getRange(rowIdx, 8).setValue(params.ESTADO || "");
          sheet.getRange(rowIdx, 9).setValue(params.MUNICIPIO || "");
          sheet.getRange(rowIdx, 10).setValue(params.PARROQUIA || "");
          
          found = true;
          break;
        }
      }
      
      if (!found) {
        throw new Error("ID de área no encontrado");
      }
      result = { success: true, message: "Área actualizada" };
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