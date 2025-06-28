'use client';

import React, { useState } from 'react';

interface YoloDetection {
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ProcessingResult {
  success: boolean;
  detections: YoloDetection[];
  processingTime: number;
  imageUrl?: string;
  error?: string;
}

export default function YoloDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(selectedFile);

      // Call YOLO inference function
      const response = await fetch('/api/yolo/inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          saveResult: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Error procesando imagen');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">YOLO Object Detection Demo</h1>
      
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Seleccionar Imagen
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Process Button */}
      {selectedFile && (
        <div className="mb-6">
          <button
            onClick={processImage}
            disabled={processing}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {processing ? 'Procesando...' : 'Detectar Objetos'}
          </button>
        </div>
      )}

      {/* Image Preview */}
      {selectedFile && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Imagen Seleccionada:</h3>
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Selected"
            className="max-w-full h-auto max-h-96 border rounded"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Resultados de Detección:</h3>
          
          {/* Processing Info */}
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <p><strong>Procesamiento exitoso:</strong> {result.processingTime}ms</p>
            <p><strong>Objetos detectados:</strong> {result.detections.length}</p>
          </div>

          {/* Detections List */}
          {result.detections.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Objetos Detectados:</h4>
              <div className="space-y-2">
                {result.detections.map((detection, index) => (
                  <div key={index} className="p-3 bg-gray-100 rounded">
                    <div className="font-medium">{detection.class}</div>
                    <div className="text-sm text-gray-600">
                      Confianza: {(detection.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Posición: ({detection.bbox.x}, {detection.bbox.y}) 
                      Tamaño: {detection.bbox.width} × {detection.bbox.height}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed Image */}
          {result.imageUrl && (
            <div>
              <h4 className="font-semibold mb-2">Imagen Procesada:</h4>
              <img
                src={result.imageUrl}
                alt="Processed"
                className="max-w-full h-auto max-h-96 border rounded"
              />
            </div>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Selecciona una imagen (JPEG, PNG o WebP)</li>
          <li>Haz clic en "Detectar Objetos" para procesar</li>
          <li>Revisa los resultados de detección</li>
          <li>Opcionalmente, descarga la imagen procesada</li>
        </ol>
      </div>
    </div>
  );
}