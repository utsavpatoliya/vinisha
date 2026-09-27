document.addEventListener('DOMContentLoaded', () => {
  // ---------- Sidebar toggle (mobile) ----------
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (
        sidebar.classList.contains('show') &&
        !sidebar.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        sidebar.classList.remove('show');
      }
    });
  }

  // ---------- Live clock ----------
  const clockEl = document.getElementById('liveClock');
  if (clockEl) {
    const updateClock = () => {
      clockEl.textContent = new Date().toLocaleString();
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ---------- Clickable table rows ----------
  document.querySelectorAll('.clickable-row').forEach((row) => {
    row.addEventListener('click', () => {
      const href = row.getAttribute('data-href');
      if (href) window.location.href = href;
    });
  });

  // ---------- Delete confirmation modal ----------
  const deleteModalEl = document.getElementById('deleteModal');
  if (deleteModalEl && window.bootstrap) {
    const deleteModal = new bootstrap.Modal(deleteModalEl);
    const deleteModalMessage = document.getElementById('deleteModalMessage');
    const deleteModalForm = document.getElementById('deleteModalForm');

    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const message = btn.getAttribute('data-message');
        deleteModalForm.setAttribute('action', action);
        if (message) deleteModalMessage.innerHTML = message;
        deleteModal.show();
      });
    });

    deleteModalEl.addEventListener('shown.bs.modal', () => {
      const submitBtn = deleteModalForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.focus();
    });

    deleteModalForm.addEventListener('submit', () => {
      showLoading();
    });
  }

  // ---------- Show loading spinner on regular form submits & nav links to PDF ----------
  document.querySelectorAll('form').forEach((form) => {
    if (form.id === 'deleteModalForm') return;
    form.addEventListener('submit', () => showLoading());
  });
});

function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('d-none');
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.add('d-none');
}

/**
 * Shows a Bootstrap toast notification.
 * @param {string} message
 * @param {'success'|'danger'|'info'} type
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  container.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}
