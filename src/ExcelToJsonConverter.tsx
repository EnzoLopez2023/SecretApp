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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Navigation Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </button>
            <div className="flex items-center gap-3 ml-4">
              <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">Excel to JSON Converter</h1>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 text-indigo-500 mb-3" />
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">Excel files (.xlsx, .xls)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {jsonData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800">Conversion successful!</p>
                  <p className="text-xs text-green-600 mt-1">
                    Found {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}: {sheets.join(', ')}
                  </p>
                </div>
                <button
                  onClick={downloadJson}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview:</h3>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(jsonData, null, 2).slice(0, 2000)}
                  {(JSON.stringify(jsonData, null, 2).length > 2000) ? '\n...(truncated)' : ''}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">How it works:</h2>
          <ul className="text-sm text-gray-600 space-y-2">
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