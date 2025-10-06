import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelToJsonConverterProps {
  onNavigateBack: () => void;
}

// Define proper types for your Excel data
type ExcelRowData = Record<string, string | number | boolean | null>;
type ExcelSheetData = ExcelRowData[];
type ConvertedData = Record<string, ExcelSheetData>;

export default function ExcelToJsonConverter({ onNavigateBack }: ExcelToJsonConverterProps) {
  const [jsonData, setJsonData] = useState<ConvertedData | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.replace('.xlsx', '').replace('.xls', ''));
    setError('');
    setJsonData(null);
    setSheets([]);

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: ConvertedData = {};
        const sheetNames: string[] = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonSheet = XLSX.utils.sheet_to_json(worksheet) as ExcelSheetData;
          result[sheetName] = jsonSheet;
          sheetNames.push(sheetName);
        });
        
        setJsonData(result);
        setSheets(sheetNames);
      } catch (err) {
        setError('Error reading Excel file. Please make sure it\'s a valid .xlsx or .xls file.');
        console.error(err);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    
    reader.readAsArrayBuffer(file);
  };

  const downloadJson = () => {
    if (!jsonData) return;
    
    const dataStr = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName || 'converted'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="shop-tools-container">
      {/* Header */}
      <div className="shop-header">
        <button
          onClick={onNavigateBack}
          className="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </button>
        
        <div className="header-title">
          <FileSpreadsheet className="w-6 h-6" />
          <h1>Excel to JSON Converter</h1>
        </div>
        
        <div className="tools-count">
          Convert Tool
        </div>
      </div>
      
      <div className="converter-content">
        <div className="converter-main">
          
          <div className="upload-section">
            <label className="upload-area">
              <div className="upload-content">
                <Upload className="upload-icon" />
                <p className="upload-text">
                  <span>Click to upload</span> or drag and drop
                </p>
                <p className="upload-subtext">Excel files (.xlsx, .xls)</p>
              </div>
              <input
                type="file"
                className="file-input"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle className="error-icon" />
              <p>{error}</p>
            </div>
          )}

          {jsonData && (
            <div className="conversion-results">
              <div className="success-message">
                <div className="success-info">
                  <p className="success-title">Conversion successful!</p>
                  <p className="success-subtitle">
                    Found {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}: {sheets.join(', ')}
                  </p>
                </div>
                <button
                  onClick={downloadJson}
                  className="download-button"
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </button>
              </div>

              <div className="preview-section">
                <h3 className="preview-title">Preview:</h3>
                <pre className="preview-content">
                  {JSON.stringify(jsonData, null, 2).slice(0, 2000)}
                  {(JSON.stringify(jsonData, null, 2).length > 2000) ? '\n...(truncated)' : ''}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="instructions-section">
          <h2 className="instructions-title">How it works:</h2>
          <ul className="instructions-list">
            <li>• Upload your Excel file (.xlsx or .xls format)</li>
            <li>• Each sheet will become a key in the JSON object</li>
            <li>• Each row becomes a JSON object with column headers as keys</li>
            <li>• Download the converted JSON file</li>
          </ul>
        </div>
      </div>
    </div>
  );
}