import { useEffect, useState } from 'react';
import { getHello, type HelloData } from '../api';

// Dòng trạng thái kiểm tra kết nối React -> Spring Boot -> Database
export default function StatusBar() {
  const [hello, setHello] = useState<HelloData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getHello()
      .then(setHello)
      .catch(() => setError('Không kết nối được backend (localhost:8080)'));
  }, []);

  if (error) {
    return <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded">● {error}</p>;
  }

  if (!hello) {
    return <p className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded">Đang kiểm tra kết nối...</p>;
  }

  return (
    <p className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded">
      ● Đã kết nối: React → Spring Boot ({hello.latencyMs} ms) → {hello.databaseProduct} (
      {hello.regionCount} điểm đến)
    </p>
  );
}
