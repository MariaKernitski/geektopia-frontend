import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Login } from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <Link to="/">Login</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}