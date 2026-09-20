import { useState } from 'react';
import { createPortal } from 'react-dom';
import '../style/PromoteModal.css';

export function PromoteModal({ isOpen, onConfirm, onCancel }) {
  const [nivel, setNivel] = useState('ADMIN_CONTEUDO');

  if (!isOpen) return null;

  return createPortal(
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <h3 className="confirm-modal-title">Promover a administrador</h3>
        <p className="confirm-modal-message">
          Escolha o nível de permissão para este usuário. Essa ação pode ser desfeita depois, a qualquer momento.
        </p>

        <div className="promote-modal-options">
          <label className="promote-modal-option">
            <input
              type="radio"
              name="nivel"
              value="ADMIN_CONTEUDO"
              checked={nivel === 'ADMIN_CONTEUDO'}
              onChange={() => setNivel('ADMIN_CONTEUDO')}
            />
            <div>
              <strong>Admin de Conteúdo</strong>
              <p>Gerencia eventos, páginas e conteúdo do site.</p>
            </div>
          </label>

          <label className="promote-modal-option">
            <input
              type="radio"
              name="nivel"
              value="ADMIN_GERAL"
              checked={nivel === 'ADMIN_GERAL'}
              onChange={() => setNivel('ADMIN_GERAL')}
            />
            <div>
              <strong>Admin Geral</strong>
              <p>Acesso total, incluindo gerenciar outros administradores.</p>
            </div>
          </label>
        </div>

        <div className="confirm-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onConfirm(nivel)}>Promover</button>
        </div>
      </div>
    </div>,
    document.body
  );
}