import Appointment from '../components/Appointment';

export default function AppointmentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Agendar Cita
        </h1>
        <Appointment />
      </div>
    </div>
  );
}