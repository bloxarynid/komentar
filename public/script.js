class CommentSystem {
    constructor() {
        this.apiUrl = '/api/komentar'; // Relative path untuk Vercel
        this.init();
    }

    init() {
        // Load comments saat halaman dimuat
        this.loadComments();
        
        // Setup event listeners
        document.getElementById('commentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitComment();
        });
        
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadComments();
        });
        
        // Character counter untuk textarea
        document.getElementById('comment').addEventListener('input', (e) => {
            document.getElementById('charCount').textContent = e.target.value.length;
        });
        
        // Auto-refresh setiap 30 detik
        setInterval(() => this.loadComments(), 30000);
    }

    async loadComments() {
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> Memuat komentar...
            </div>
        `;
        
        try {
            const response = await fetch(this.apiUrl);
            const result = await response.json();
            
            if (result.success) {
                this.displayComments(result.data);
            } else {
                this.showNotification('Gagal memuat komentar', 'error');
                commentsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Gagal memuat komentar. Coba refresh halaman.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Koneksi error', 'error');
        }
    }

    displayComments(comments) {
        const commentsList = document.getElementById('commentsList');
        const commentCount = document.getElementById('commentCount');
        
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comment-slash"></i>
                    <h3>Belum ada komentar</h3>
                    <p>Jadilah yang pertama berkomentar!</p>
                </div>
            `;
            commentCount.textContent = '0';
            return;
        }
        
        commentCount.textContent = comments.length;
        
        commentsList.innerHTML = comments.map(comment => this.createCommentHTML(comment)).join('');
    }

    createCommentHTML(comment) {
        const date = new Date(comment.created_at);
        const formattedDate = date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const initial = comment.username.charAt(0).toUpperCase();
        const websiteHTML = comment.website ? 
            `<a href="${this.ensureHttp(comment.website)}" target="_blank" class="website">
                <i class="fas fa-link"></i> ${this.extractDomain(comment.website)}
            </a>` : '';
        
        return `
            <div class="comment-item" data-id="${comment.id}">
                <div class="comment-header">
                    <div class="user-info">
                        <div class="avatar">${initial}</div>
                        <div class="user-details">
                            <h3>${this.escapeHtml(comment.username)}</h3>
                            <div class="email">${this.escapeHtml(comment.email)}</div>
                            ${websiteHTML}
                        </div>
                    </div>
                    <div class="timestamp">
                        <i class="far fa-clock"></i> ${formattedDate}
                    </div>
                </div>
                <div class="comment-content">${this.escapeHtml(comment.comment || comment.komentar)}</div>
            </div>
        `;
    }

    async submitComment() {
        const form = document.getElementById('commentForm');
        const formData = new FormData(form);
        const submitBtn = form.querySelector('.submit-btn');
        
        const data = {
            username: formData.get('username').trim(),
            email: formData.get('email').trim(),
            website: formData.get('website').trim() || null,
            komentar: formData.get('comment').trim()
        };
        
        // Validasi client-side
        if (!data.username || !data.email || !data.komentar) {
            this.showNotification('Harap isi semua field wajib', 'error');
            return;
        }
        
        // Validasi email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showNotification('Format email tidak valid', 'error');
            return;
        }
        
        // Disable tombol saat mengirim
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                form.reset();
                document.getElementById('charCount').textContent = '0';
                this.loadComments(); // Refresh komentar
            } else {
                this.showNotification(result.message || 'Gagal mengirim komentar', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Gagal mengirim komentar. Cek koneksi internet.', 'error');
        } finally {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Komentar';
            submitBtn.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.display = 'block';
        
        // Auto-hide setelah 5 detik
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }

    // Helper functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    ensureHttp(url) {
        if (!url) return '#';
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
        }
        return url;
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(this.ensureHttp(url));
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    }
}

// Inisialisasi sistem komentar saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    new CommentSystem();
});
