/* Settings page logic */

/**
 * Initialize settings page
 */
function initSettingsPage() {
    // Render settings content
    renderSettingsContent();

    // Setup event listeners
    setupSettingsListeners();
}

/**
 * Render settings content
 */
function renderSettingsContent() {
    const settingsContainer = document.getElementById('settings-content');
    if (!settingsContainer) return;

    // Get current theme preference
    const currentTheme = localStorage.getItem('theme') || 'system';
    const currentDateFormat = localStorage.getItem('dateFormat') || 'MM/DD/YYYY';
    const profile = utils.loadProfile();
    const profileInitials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'S';

    settingsContainer.innerHTML = `
        <div class="settings-section">
            <h2>Profile</h2>
            <div class="profile-editor">
                <div class="profile-preview-wrap">
                    <div id="profilePhotoPreview" class="profile-avatar profile-preview" aria-label="${utils.escapeHtml(profile.name)} profile picture">${profile.photo ? '' : profileInitials}</div>
                    <button type="button" class="profile-photo-edit" id="editProfilePhotoBtn" aria-label="Edit profile photo" title="Edit profile photo"><i data-lucide="pencil"></i></button>
                </div>
                <div class="profile-editor-fields">
                    <div class="settings-group">
                        <label for="profileNameInput">Your name</label>
                        <input id="profileNameInput" type="text" value="${utils.escapeHtml(profile.name)}" maxlength="40" autocomplete="name" required>
                    </div>
                    <input id="profilePhotoInput" type="file" accept="image/*" hidden>
                    <div class="profile-photo-actions">
                        <button type="button" class="btn btn-outline" id="changeProfilePhotoBtn">Change photo</button>
                        <button type="button" class="btn btn-outline" id="removeProfilePhotoBtn">Remove photo</button>
                    </div>
                    <div class="profile-crop-modal" id="profilePositionControls" hidden>
                        <section class="profile-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="profileCropTitle">
                            <header class="profile-crop-header">
                                <div><h3 id="profileCropTitle">Crop photo</h3><p>Move the crop box to reframe the photo. Drag its corner to trim the edges.</p></div>
                                <button type="button" class="profile-crop-close" id="closeCropEditorBtn" aria-label="Close crop editor">&times;</button>
                            </header>
                            <div class="profile-crop-content">
                                <div class="profile-crop-stage" id="profileCropStage">
                                    <img id="profileCropImage" alt="Photo to crop" draggable="false">
                                    <div class="profile-crop-selection" id="profileCropSelection" aria-label="Crop area">
                                        <span class="profile-crop-handle" aria-hidden="true"></span>
                                    </div>
                                </div>
                            </div>
                            <footer class="profile-crop-actions">
                                <button type="button" class="btn btn-outline" id="chooseCropPhotoBtn" ${profile.photo ? '' : 'disabled'}>Change photo</button>
                                <button type="button" class="btn btn-primary" id="applyCropBtn" ${profile.photo ? '' : 'disabled'}>Crop photo</button>
                                <button type="button" class="btn btn-primary" id="closeCropEditorDoneBtn">Done</button>
                            </footer>
                        </section>
                    </div>
                    <p class="settings-description">Photos are resized and saved only in this browser.</p>
                    <button type="button" class="btn btn-primary" id="saveProfileBtn">Save profile</button>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <h2>Appearance</h2>
            <div class="settings-group">
                <label for="themeSelect">Theme</label>
                <select id="themeSelect">
                    <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
                    <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
                    <option value="system">System preference</option>
                </select>
                <p class="settings-description">Choose your preferred color theme.</p>
            </div>
        </div>

        <div class="settings-section">
            <h2>Preferences</h2>
            <div class="settings-group">
                <label for="currencySelect">Currency (PHP only)</label>
                <select id="currencySelect">
                    <option value="PHP" selected>Philippine Peso (₱)</option>
                    <!-- Other currencies could be added here -->
                </select>
                <p class="settings-description">PesoPal currently supports Philippine peso.</p>
            </div>
            <div class="settings-group">
                <label for="dateFormatSelect">Date Format</label>
                <select id="dateFormatSelect">
                    <option value="MM/DD/YYYY" ${currentDateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY" ${currentDateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD" ${currentDateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                </select>
                <p class="settings-description">Select your preferred date format.</p>
            </div>
        </div>

        <div class="settings-section">
            <h2>Data Management</h2>
            <div class="settings-group">
                <button class="btn btn-primary" id="exportDataBtn">
                    <i data-lucide="upload-cloud"></i> Export Data
                </button>
                <p class="settings-description">Download a backup of your data in JSON format.</p>
            </div>
            <div class="settings-group">
                <input type="file" id="importFileInput" accept=".json" style="display: none;">
                <button class="btn btn-outline" id="importDataBtn">
                    <i data-lucide="download-cloud"></i> Import Data
                </button>
                <p class="settings-description">Restore your data from a backup file.</p>
            </div>
            <div class="settings-group">
                <button class="btn btn-outline btn-danger" id="clearDataBtn">
                    <i data-lucide="trash-2"></i> Clear All Data
                </button>
                <p class="settings-description">Delete all transactions, budgets, and savings goals. This action cannot be undone.</p>
            </div>
        </div>
    `;

    // Add event listeners
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            if (theme === 'system') {
                const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', Boolean(systemDark));
                localStorage.removeItem('theme');
            } else {
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                localStorage.setItem('theme', theme);
            }
            // Update Lucide icons for theme toggle button if it exists
            const themeToggleBtn = document.getElementById('themeToggleBtn');
            if (themeToggleBtn) {
                const icon = themeToggleBtn.querySelector('i');
                if (icon) {
                    icon.dataset.lucide = document.documentElement.classList.contains('dark') ? 'sun' : 'moon';
                    lucide.createIcons();
                }
            }
            document.dispatchEvent(new CustomEvent('theme:changed'));
        });
    }

    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) currencySelect.closest('.settings-group').innerHTML = '<p><strong>Currency:</strong> Philippine peso (PHP). This is the only supported currency.</p>';
    const dateFormatSelect = document.getElementById('dateFormatSelect');
    if (dateFormatSelect) dateFormatSelect.addEventListener('change', event => {
        localStorage.setItem('dateFormat', event.target.value);
        utils.showToast({ message: 'Date format saved.', type: 'success' });
    });

    let profileDraft = { ...profile, photoPosition: { ...profile.photoPosition } };
    const profilePreview = document.getElementById('profilePhotoPreview');
    profilePreview.style.backgroundImage = profile.photo ? `url("${profile.photo}")` : 'none';
    profilePreview.style.backgroundPosition = `${profile.photoPosition.x}% ${profile.photoPosition.y}%`;
    const profileNameInput = document.getElementById('profileNameInput');
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const removeProfilePhotoBtn = document.getElementById('removeProfilePhotoBtn');
    const cropImage = document.getElementById('profileCropImage');
    const cropStage = document.getElementById('profileCropStage');
    const cropSelection = document.getElementById('profileCropSelection');
    removeProfilePhotoBtn.disabled = !profileDraft.photo;
    const updateProfilePreview = () => {
        const name = profileNameInput.value.trim() || 'Student';
        const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'S';
        profilePreview.textContent = profileDraft.photo ? '' : initials;
        profilePreview.style.backgroundImage = profileDraft.photo ? `url("${profileDraft.photo}")` : 'none';
        profilePreview.style.backgroundPosition = `${profileDraft.photoPosition.x}% ${profileDraft.photoPosition.y}%`;
        profilePreview.setAttribute('aria-label', `${name} profile picture`);
        removeProfilePhotoBtn.disabled = !profileDraft.photo;
        document.getElementById('applyCropBtn').disabled = !profileDraft.photo;
        document.getElementById('chooseCropPhotoBtn').disabled = !profileDraft.photo;
    };
    const profilePositionControls = document.getElementById('profilePositionControls');
    const openCropEditor = () => {
        profilePositionControls.hidden = false;
        document.body.classList.add('modal-open');
        document.getElementById('closeCropEditorDoneBtn').focus();
        setCropImage();
        if (!profileDraft.photo) profilePhotoInput.click();
    };
    const closeCropEditor = () => {
        profilePositionControls.hidden = true;
        document.body.classList.remove('modal-open');
        document.getElementById('editProfilePhotoBtn').focus();
    };
    document.getElementById('editProfilePhotoBtn').addEventListener('click', openCropEditor);
    document.getElementById('changeProfilePhotoBtn').addEventListener('click', () => profilePhotoInput.click());
    document.getElementById('chooseCropPhotoBtn').addEventListener('click', () => profilePhotoInput.click());
    document.getElementById('closeCropEditorBtn').addEventListener('click', closeCropEditor);
    document.getElementById('closeCropEditorDoneBtn').addEventListener('click', closeCropEditor);
    document.getElementById('applyCropBtn').addEventListener('click', () => {
        if (!profileDraft.photo) return;
        const imageBounds = cropImage.getBoundingClientRect();
        const ratioX = cropImage.naturalWidth / imageBounds.width;
        const ratioY = cropImage.naturalHeight / imageBounds.height;
        const sourceX = cropSelection.offsetLeft * ratioX;
        const sourceY = cropSelection.offsetTop * ratioY;
        const sourceSide = cropSelection.offsetWidth * Math.min(ratioX, ratioY);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const context = canvas.getContext('2d');
        if (!context) {
            utils.showToast({ message: 'Unable to crop this photo.', type: 'error' });
            return;
        }
        try {
            context.drawImage(cropImage, sourceX, sourceY, sourceSide, sourceSide, 0, 0, 512, 512);
            profileDraft.photo = canvas.toDataURL('image/jpeg', 0.88);
            profileDraft.photoPosition = { x: 50, y: 50 };
            cropPhotoSource = '';
            updateProfilePreview();
            setCropImage();
            utils.showToast({ message: 'Crop applied. Save your profile to keep it.', type: 'success' });
        } catch (error) {
            utils.showToast({ message: 'Unable to crop this photo. Try another image.', type: 'error' });
        }
    });
    profilePositionControls.addEventListener('click', event => { if (event.target === profilePositionControls) closeCropEditor(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !profilePositionControls.hidden) closeCropEditor(); });
    let cropPhotoSource = '';
    const setCropImage = () => {
        if (!profileDraft.photo || cropPhotoSource === profileDraft.photo) return;
        cropPhotoSource = profileDraft.photo;
        cropImage.onload = () => {
            const rect = cropImage.getBoundingClientRect();
            const side = Math.min(rect.width, rect.height) * 0.78;
            cropSelection.style.width = `${side}px`;
            cropSelection.style.height = `${side}px`;
            cropSelection.style.left = `${(rect.width - side) / 2}px`;
            cropSelection.style.top = `${(rect.height - side) / 2}px`;
        };
        cropImage.src = cropPhotoSource;
    };
    let cropDrag = null;
    const clampSelection = (left, top, size) => {
        const imageRect = cropImage.getBoundingClientRect();
        const maxSide = Math.min(imageRect.width, imageRect.height);
        size = Math.max(Math.min(64, maxSide), Math.min(size, maxSide));
        return {
            size,
            left: Math.max(0, Math.min(imageRect.width - size, left)),
            top: Math.max(0, Math.min(imageRect.height - size, top))
        };
    };
    const applySelection = (left, top, size) => {
        const crop = clampSelection(left, top, size);
        cropSelection.style.width = `${crop.size}px`;
        cropSelection.style.height = `${crop.size}px`;
        cropSelection.style.left = `${crop.left}px`;
        cropSelection.style.top = `${crop.top}px`;
    };
    cropSelection.addEventListener('pointerdown', event => {
        if (!profileDraft.photo) return;
        const isResize = event.target.classList.contains('profile-crop-handle');
        cropDrag = {
            mode: isResize ? 'resize' : 'move',
            pointerX: event.clientX,
            pointerY: event.clientY,
            left: cropSelection.offsetLeft,
            top: cropSelection.offsetTop,
            size: cropSelection.offsetWidth
        };
        cropSelection.setPointerCapture(event.pointerId);
        event.preventDefault();
    });
    cropSelection.addEventListener('pointermove', event => {
        if (!cropDrag) return;
        const dx = event.clientX - cropDrag.pointerX;
        const dy = event.clientY - cropDrag.pointerY;
        if (cropDrag.mode === 'resize') {
            applySelection(cropDrag.left, cropDrag.top, cropDrag.size + Math.max(dx, dy));
        } else {
            applySelection(cropDrag.left + dx, cropDrag.top + dy, cropDrag.size);
        }
    });
    const stopCropDrag = () => { cropDrag = null; };
    cropSelection.addEventListener('pointerup', stopCropDrag);
    cropSelection.addEventListener('pointercancel', stopCropDrag);
    removeProfilePhotoBtn.addEventListener('click', () => {
        profileDraft.photo = '';
        profileDraft.photoPosition = { x: 50, y: 50 };
        profilePhotoInput.value = '';
        updateProfilePreview();
    });
    profileNameInput.addEventListener('input', updateProfilePreview);
    profilePhotoInput.addEventListener('change', event => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
            utils.showToast({ message: 'Choose an image smaller than 8 MB.', type: 'error' });
            profilePhotoInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onerror = () => utils.showToast({ message: 'Unable to read that image.', type: 'error' });
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => utils.showToast({ message: 'That image could not be opened.', type: 'error' });
            image.onload = () => {
                    if (image.naturalWidth > 12000 || image.naturalHeight > 12000) {
                        utils.showToast({ message: 'That image is too large to process.', type: 'error' });
                        return;
                    }
                const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
                const context = canvas.getContext('2d');
                if (!context) {
                    utils.showToast({ message: 'Unable to process that image.', type: 'error' });
                    return;
                }
                try {
                    context.fillStyle = '#FFFFFF';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    profileDraft.photo = canvas.toDataURL('image/jpeg', 0.82);
                    profileDraft.photoPosition = { x: 50, y: 50 };
                    profilePositionControls.hidden = false;
                    updateProfilePreview();
                    cropPhotoSource = '';
                    setCropImage();
                } catch (error) {
                    utils.showToast({ message: 'Unable to process that image. Try another photo.', type: 'error' });
                }
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
    document.getElementById('saveProfileBtn').addEventListener('click', () => {
        const name = profileNameInput.value.trim();
        if (!name) {
            utils.showToast({ message: 'Please enter your name.', type: 'error' });
            profileNameInput.focus();
            return;
        }
        if (utils.saveProfile({ ...profileDraft, name })) {
            profileDraft.name = name;
            utils.showToast({ message: 'Profile saved successfully.', type: 'success' });
        }
    });

    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }

    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    if (importDataBtn && importFileInput) {
        importDataBtn.addEventListener('click', () => {
            importFileInput.click();
        });
        importFileInput.addEventListener('change', async (e) => {
            await importData(e);
        });
    }

    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', async () => {
            await clearData();
        });
    }

    // Update Lucide icons
    lucide.createIcons();
}

/**
 * Setup event listeners for settings page
 */
function setupSettingsListeners() {
    // Already set up in renderSettingsContent
}

/**
 * Export data as JSON backup
 */
function exportData() {
    const data = storage.loadData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'pesoPal-backup.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    utils.showToast({ message: 'Data exported successfully', type: 'success' });
}

/**
 * Import data from JSON backup
 */
async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            // Validate that the imported data has the expected structure
            const validArrays = importedData && Array.isArray(importedData.transactions) && Array.isArray(importedData.budgets) && Array.isArray(importedData.savingsGoals);
            const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().startsWith(value);
            const validTransactions = validArrays && importedData.transactions.every(item => item && item.id != null && ['income', 'expense'].includes(item.type) && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && validDate(item.date) && typeof item.description === 'string' && item.description.trim() && typeof item.category === 'string' && item.category.trim());
            const validBudgets = validArrays && importedData.budgets.every(item => item && item.id != null && typeof item.name === 'string' && item.category && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && validDate(item.startDate) && validDate(item.endDate) && item.endDate >= item.startDate);
            const validGoals = validArrays && importedData.savingsGoals.every(item => item && item.id != null && typeof item.name === 'string' && item.name.trim() && Number.isFinite(Number(item.targetAmount)) && Number(item.targetAmount) > 0 && Number.isFinite(Number(item.savedAmount)) && Number(item.savedAmount) >= 0 && (!item.targetDate || validDate(item.targetDate)));
            if (validArrays && validTransactions && validBudgets && validGoals) {
                const confirmed = await utils.confirmAction('This will replace all your current data. Are you sure?');
                if (confirmed) {
                    if (!storage.saveData(importedData, true)) {
                        utils.showToast({ message: 'Unable to save imported data. Please try again.', type: 'error' });
                        return;
                    }
                    utils.showToast({ message: 'Data imported successfully', type: 'success' });
                    // Reload the page to reflect the new data
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                }
            } else {
                utils.showToast({ message: 'Invalid backup file format', type: 'error' });
            }
        } catch (error) {
            utils.showToast({ message: 'Failed to parse backup file', type: 'error' });
        }
    };
    reader.onerror = function() {
        utils.showToast({ message: 'Error reading file', type: 'error' });
    };
    reader.readAsText(file);
}

/**
 * Clear all saved financial records
 */
async function clearData() {
    const confirmed = await utils.confirmAction('Are you sure you want to delete all data? This action cannot be undone.');
    if (confirmed) {
        storage.clearAllData();
        utils.showToast({ message: 'All financial data has been cleared.', type: 'success' });
        // Reload the page to reflect the cleared data
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

// Export functions for use in other modules (if needed)
window.settings = {
    initSettingsPage,
    renderSettingsContent,
    exportData,
    importData,
    clearData
};

// Initialize the page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsPage);
} else {
    initSettingsPage();
}
