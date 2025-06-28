'use client';

import { useState, FormEvent } from 'react';

interface AppointmentData {
  clinic: string;
  date: string;
  patientName: string;
  phone: string;
  gender: string;
}

const clinics = [
  { id: 'clinic1', name: 'Clínica Central' },
  { id: 'clinic2', name: 'Clínica Norte' },
  { id: 'clinic3', name: 'Clínica Sur' },
  { id: 'clinic4', name: 'Clínica Este' },
];

const genderOptions = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
];

export default function Appointment() {
  const [formData, setFormData] = useState<AppointmentData>({
    clinic: '',
    date: '',
    patientName: '',
    phone: '',
    gender: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Basic validation
    if (!formData.clinic || !formData.date || !formData.patientName || !formData.phone || !formData.gender) {
      setMessage('Por favor, complete todos los campos');
      setLoading(false);
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^[0-9]{10,}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setMessage('Por favor, ingrese un número de teléfono válido');
      setLoading(false);
      return;
    }

    try {
      // Here you would typically save to Firebase or your backend
      console.log('Appointment data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Cita agendada exitosamente');
      
      // Reset form
      setFormData({
        clinic: '',
        date: '',
        patientName: '',
        phone: '',
        gender: '',
      });
    } catch (error) {
      console.error('Error saving appointment:', error);
      setMessage('Error al agendar la cita. Por favor, intente nuevamente.');
    }

    setLoading(false);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Clinic Selection */}
        <div>
          <label htmlFor="clinic" className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Clínica *
          </label>
          <select
            id="clinic"
            name="clinic"
            value={formData.clinic}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccione una clínica</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Appointment Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de la Cita *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Patient Name */}
        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Paciente *
          </label>
          <input
            type="text"
            id="patientName"
            name="patientName"
            value={formData.patientName}
            onChange={handleInputChange}
            placeholder="Ingrese el nombre completo"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Ej: 0999123456"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
            Sexo *
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccione el sexo</option>
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-md ${
            message.includes('exitosamente') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Guardando...' : 'Guardar Cita'}
          </button>
        </div>
      </form>
    </div>
  );
}