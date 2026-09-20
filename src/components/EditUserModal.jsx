import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../style/EditUserModal.css';

export function EditUserModal({ isOpen, usuario, onSave, onCancel }) {
  const [form, setForm] = useState({ nome_completo: '', email: '', telefone: '', cidade: '', estado: '' });
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (usuario) {
      setForm({
        nome_completo: usuario.nome_completo || '',
        email: usuario.email || '',
        telefone: usuario.telefone || '',
        cidade: usuario.cidade || '',
        estado: usuario.estado || ''
      });
      setMensagem('');
    }
  }, [usuario]);

  if (!isOpen) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(usuario.id_usuario, form);
    } catch (err) {
      setMensagem(err.response?.data?.error || 'Erro ao salvar alterações.');
    }
  };

  return createPortal(
    <div className="edit-modal-overlay" onClick={onCancel}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="edit-modal-title">Editar usuário</h3>

        <p className="edit-modal-doc">
            {usuario?.cpf
            ? `CPF: ${usuario.cpf}`
            : usuario?.cnpj
            ? `CNPJ: ${usuario.cnpj}`
            : usuario?.passaporte
            ? `Passaporte: ${usuario.passaporte}`
            : 'Documento não informado'}
        </p>

        {mensagem && <div className="edit-modal-feedback">{mensagem}</div>}

        <form onSubmit={handleSubmit}>
          <div className="edit-modal-field">
            <label>Nome completo</label>
            <input name="nome_completo" value={form.nome_completo} onChange={handleChange} />
          </div>
          <div className="edit-modal-field">
            <label>E-mail</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="edit-modal-field">
            <label>Telefone</label>
            <input name="telefone" value={form.telefone} onChange={handleChange} />
          </div>
          <div className="edit-modal-row">
            <div className="edit-modal-field">
              <label>Cidade</label>
              <input name="cidade" value={form.cidade} onChange={handleChange} />
            </div>
            <div className="edit-modal-field" style={{ maxWidth: '80px' }}>
              <label>Estado</label>
              <input name="estado" value={form.estado} onChange={handleChange} maxLength={2} />
            </div>
          </div>

          <div className="edit-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}