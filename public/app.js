// API Configuration
const API_BASE = 'http://localhost:4000/api';

// Application State
let currentPage = 1;
let pageSize = 10;
let sortBy = 'last_name:asc';
let searchQuery = '';
let editingContactId = null;
let deletingContactId = null;
let currentNotesContactId = null;

// DOM Elements
const contactsBody = document.getElementById('contactsBody');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const addContactBtn = document.getElementById('addContactBtn');
const contactModal = document.getElementById('contactModal');
const notesModal = document.getElementById('notesModal');
const deleteModal = document.getElementById('deleteModal');
const contactForm = document.getElementById('contactForm');
const themeToggle = document.getElementById('themeToggle');

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    await loadPreferences();
    await loadContacts();
    setupEventListeners();
});

// API Functions
async function fetchContacts(search = '', page = 1, size = 10, sort = 'last_name:asc') {
    try {
        const params = new URLSearchParams({
            search,
            page,
            pageSize: size,
            sort
        });
        const response = await fetch(`${API_BASE}/contacts?${params}`);
        if (!response.ok) throw new Error('Failed to fetch contacts');
        return await response.json();
    } catch (error) {
        console.error('Error fetching contacts:', error);
        showError('Failed to load contacts');
        return null;
    }
}

async function getContact(id) {
    try {
        const response = await fetch(`${API_BASE}/contacts/${id}`);
        if (!response.ok) throw new Error('Failed to fetch contact');
        return await response.json();
    } catch (error) {
        console.error('Error fetching contact:', error);
        showError('Failed to load contact');
        return null;
    }
}

async function createContact(contactData) {
    try {
        const response = await fetch(`${API_BASE}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create contact');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating contact:', error);
        showError(error.message);
        throw error;
    }
}

async function updateContact(id, contactData) {
    try {
        const response = await fetch(`${API_BASE}/contacts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update contact');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating contact:', error);
        showError(error.message);
        throw error;
    }
}

async function deleteContact(id) {
    try {
        const response = await fetch(`${API_BASE}/contacts/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete contact');
        return true;
    } catch (error) {
        console.error('Error deleting contact:', error);
        showError('Failed to delete contact');
        return false;
    }
}

async function fetchNotes(contactId) {
    try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/notes`);
        if (!response.ok) throw new Error('Failed to fetch notes');
        return await response.json();
    } catch (error) {
        console.error('Error fetching notes:', error);
        showError('Failed to load notes');
        return [];
    }
}

async function addNote(contactId, noteBody) {
    try {
        const response = await fetch(`${API_BASE}/contacts/${contactId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: noteBody })
        });
        if (!response.ok) throw new Error('Failed to add note');
        return await response.json();
    } catch (error) {
        console.error('Error adding note:', error);
        showError('Failed to add note');
        throw error;
    }
}

async function loadPreferences() {
    try {
        const response = await fetch(`${API_BASE}/preferences`);
        if (!response.ok) throw new Error('Failed to fetch preferences');
        const prefs = await response.json();

        // Apply preferences
        if (prefs.theme) {
            document.body.classList.toggle('dark-theme', prefs.theme === 'dark');
        }
        if (prefs.defaultSort) {
            sortBy = prefs.defaultSort;
            sortSelect.value = sortBy;
        }
        if (prefs.rowsPerPage) {
            pageSize = prefs.rowsPerPage;
            pageSizeSelect.value = pageSize;
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

async function savePreferences() {
    try {
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const response = await fetch(`${API_BASE}/preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                theme,
                defaultSort: sortBy,
                rowsPerPage: pageSize
            })
        });
        if (!response.ok) throw new Error('Failed to save preferences');
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
}

// UI Functions
async function loadContacts() {
    const data = await fetchContacts(searchQuery, currentPage, pageSize, sortBy);
    if (!data) return;

    renderContacts(data.data);
    updatePagination(data.page, data.pageSize, data.total);
}

function renderContacts(contacts) {
    if (!contacts || contacts.length === 0) {
        contactsBody.innerHTML = '<tr><td colspan="5" class="no-data">No contacts found</td></tr>';
        return;
    }

    contactsBody.innerHTML = contacts.map(contact => `
        <tr>
            <td>${escapeHtml(contact.first_name)} ${escapeHtml(contact.last_name)}</td>
            <td>${escapeHtml(contact.email)}</td>
            <td>${contact.phone ? escapeHtml(contact.phone) : '-'}</td>
            <td>${contact.company ? escapeHtml(contact.company) : '-'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="viewNotes(${contact.id})">Notes</button>
                <button class="btn btn-sm btn-primary" onclick="editContact(${contact.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="confirmDelete(${contact.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updatePagination(page, size, total) {
    const totalPages = Math.ceil(total / size);
    currentPage = page;

    pageInfo.textContent = `Page ${page} of ${totalPages} (${total} total)`;
    prevPageBtn.disabled = page <= 1;
    nextPageBtn.disabled = page >= totalPages;
}

function openModal(modalElement) {
    modalElement.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalElement) {
    modalElement.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showError(message) {
    alert('Error: ' + message);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 100);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Handlers
function setupEventListeners() {
    // Search
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = searchInput.value;
            currentPage = 1;
            loadContacts();
        }, 300);
    });

    // Sorting
    sortSelect.addEventListener('change', () => {
        sortBy = sortSelect.value;
        currentPage = 1;
        loadContacts();
        savePreferences();
    });

    // Page Size
    pageSizeSelect.addEventListener('change', () => {
        pageSize = parseInt(pageSizeSelect.value);
        currentPage = 1;
        loadContacts();
        savePreferences();
    });

    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadContacts();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        currentPage++;
        loadContacts();
    });

    // Add Contact Button
    addContactBtn.addEventListener('click', () => {
        editingContactId = null;
        document.getElementById('modalTitle').textContent = 'Add Contact';
        contactForm.reset();
        openModal(contactModal);
    });

    // Contact Form Submit
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const contactData = {
            first_name: document.getElementById('firstName').value.trim(),
            last_name: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim() || null,
            company: document.getElementById('company').value.trim() || null
        };

        try {
            if (editingContactId) {
                await updateContact(editingContactId, contactData);
                showSuccess('Contact updated successfully');
            } else {
                await createContact(contactData);
                showSuccess('Contact added successfully');
            }
            closeModal(contactModal);
            loadContacts();
        } catch (error) {
            // Error already shown in API function
        }
    });

    // Cancel Button
    document.getElementById('cancelBtn').addEventListener('click', () => {
        closeModal(contactModal);
    });

    // Close buttons
    document.querySelector('.close').addEventListener('click', () => {
        closeModal(contactModal);
    });

    document.querySelector('.close-notes').addEventListener('click', () => {
        closeModal(notesModal);
    });

    document.querySelector('.close-delete').addEventListener('click', () => {
        closeModal(deleteModal);
    });

    // Delete Confirmation
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        closeModal(deleteModal);
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        if (deletingContactId) {
            const success = await deleteContact(deletingContactId);
            if (success) {
                showSuccess('Contact deleted successfully');
                closeModal(deleteModal);
                loadContacts();
            }
        }
    });

    // Notes
    document.getElementById('addNoteBtn').addEventListener('click', async () => {
        const noteInput = document.getElementById('noteInput');
        const noteBody = noteInput.value.trim();

        if (!noteBody) {
            showError('Please enter a note');
            return;
        }

        try {
            await addNote(currentNotesContactId, noteBody);
            noteInput.value = '';
            await loadNotes(currentNotesContactId);
            showSuccess('Note added successfully');
        } catch (error) {
            // Error already shown in API function
        }
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        savePreferences();
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            closeModal(contactModal);
        }
        if (e.target === notesModal) {
            closeModal(notesModal);
        }
        if (e.target === deleteModal) {
            closeModal(deleteModal);
        }
    });
}

// Global Functions (called from HTML onclick)
async function editContact(id) {
    editingContactId = id;
    const contact = await getContact(id);

    if (!contact) return;

    document.getElementById('modalTitle').textContent = 'Edit Contact';
    document.getElementById('firstName').value = contact.first_name;
    document.getElementById('lastName').value = contact.last_name;
    document.getElementById('email').value = contact.email;
    document.getElementById('phone').value = contact.phone || '';
    document.getElementById('company').value = contact.company || '';

    openModal(contactModal);
}

function confirmDelete(id) {
    deletingContactId = id;
    openModal(deleteModal);
}

async function viewNotes(contactId) {
    currentNotesContactId = contactId;
    const contact = await getContact(contactId);

    if (!contact) return;

    document.getElementById('notesModalTitle').textContent =
        `Notes for ${contact.first_name} ${contact.last_name}`;
    document.getElementById('noteInput').value = '';

    openModal(notesModal);
    await loadNotes(contactId);
}

async function loadNotes(contactId) {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '<p class="loading">Loading notes...</p>';

    const notes = await fetchNotes(contactId);

    if (!notes || notes.length === 0) {
        notesList.innerHTML = '<p class="no-data">No notes yet</p>';
        return;
    }

    notesList.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-body">${escapeHtml(note.body)}</div>
            <div class="note-date">${formatDate(note.createdAt)}</div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
