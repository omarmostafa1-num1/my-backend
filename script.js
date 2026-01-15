// ===================================
// Supported Formats Configuration
// ===================================
const FILE_FORMATS = {
    image: {
        extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'ico'],
        accept: 'image/*',
        description: 'Supported Formats: JPG, PNG, WebP, GIF, BMP, SVG, ICO'
    },
    document: {
        extensions: ['pdf', 'docx', 'doc', 'txt', 'html', 'rtf', 'odt', 'xlsx', 'pptx', 'csv'],
        accept: '.pdf,.doc,.docx,.txt,.html,.rtf,.odt,.xlsx,.pptx,.csv',
        description: 'Supported Formats: PDF, DOCX, XLSX, PPTX, HTML, TXT'
    },
    audio: {
        extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'],
        accept: 'audio/*',
        description: 'Supported Formats: MP3, WAV, OGG, M4A, FLAC, AAC'
    },
    video: {
        extensions: ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv'],
        accept: 'video/*',
        description: 'Supported Formats: MP4, AVI, MOV, WebM, MKV, FLV'
    },
    ebook: {
        extensions: ['epub', 'mobi', 'azw3', 'pdf', 'txt', 'fb2'],
        accept: '.epub,.mobi,.azw3,.pdf,.txt,.fb2',
        description: 'Supported Formats: EPUB, MOBI, AZW3, PDF, FB2'
    },
    archive: {
        extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
        accept: '.zip,.rar,.7z,.tar,.gz,.bz2',
        description: 'Supported Formats: ZIP, RAR, 7Z, TAR'
    }
};

// ===================================
// Global Variables
// ===================================
let currentCategory = 'image';
let selectedFile = null;
let isConverting = false;

// ===================================
// DOM Elements
// ===================================
const elements = {
    categoryButtons: document.querySelectorAll('.category-btn'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    // element deleted: uploadDescription: document.getElementById('uploadDescription'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    removeFileBtn: document.getElementById('removeFileBtn'),
    formatSelection: document.getElementById('formatSelection'),
    fromFormat: document.getElementById('fromFormat'),
    toFormat: document.getElementById('toFormat'),
    convertBtn: document.getElementById('convertBtn'),
    progressContainer: document.getElementById('progressContainer'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    successMessage: document.getElementById('successMessage'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText')
};

// ===================================
// Initialization
// ===================================
function init() {
    setupCategoryButtons();
    setupDropdowns();
    setupFileUpload();
    setupDragAndDrop();
    setupRemoveFile();
    setupConvertButton();
    updateFormatOptions();
}

// ===================================
// Category Buttons Setup
// ===================================
function setupCategoryButtons() {
    elements.categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent event from bubbling to wrapper
            e.stopPropagation();

            // Remove active class from all
            elements.categoryButtons.forEach(b => b.classList.remove('active'));

            // Add active class to current
            btn.classList.add('active');

            // Update current category
            currentCategory = btn.dataset.category;

            // Reset file selection
            resetFileSelection();

            // Update format options
            updateFormatOptions();

            // Update allowed formats description
            // Description element removed
            // elements.uploadDescription.textContent = FILE_FORMATS[currentCategory].description;

            // Update accepted file types
            elements.fileInput.accept = FILE_FORMATS[currentCategory].accept;
        });
    });
}

// ===================================
// Dropdowns Setup
// ===================================
function setupDropdowns() {
    const wrappers = document.querySelectorAll('.category-wrapper');

    wrappers.forEach(wrapper => {
        const btn = wrapper.querySelector('.category-btn');
        const dropdown = wrapper.querySelector('.dropdown-menu');
        const items = dropdown.querySelectorAll('.dropdown-item');

        // Toggle dropdown on button click
        btn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Close other dropdowns
            wrappers.forEach(w => {
                if (w !== wrapper) {
                    w.classList.remove('open');
                }
            });

            // Toggle current dropdown
            wrapper.classList.toggle('open');
        });

        // Handle dropdown item clicks
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();

                const fromFormat = item.dataset.from;
                const toFormat = item.dataset.to;

                // Update the file input accept attribute to ONLY the source format
                elements.fileInput.accept = `.${fromFormat}`;
                // Description element removed
                // elements.uploadDescription.textContent = `Please select a ${fromFormat.toUpperCase()} file only`;

                // Set the formats selection UI
                elements.fromFormat.value = fromFormat;
                elements.toFormat.value = toFormat;

                // Close dropdown
                wrapper.classList.remove('open');

                // Trigger file input if no file selected
                if (!selectedFile) {
                    elements.fileInput.click();
                }
            });
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        wrappers.forEach(w => w.classList.remove('open'));
    });
}

// ===================================
// File Upload Setup
// ===================================
function setupFileUpload() {
    elements.uploadArea.addEventListener('click', () => {
        if (!isConverting) {
            elements.fileInput.click();
        }
    });

    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelection(file);
        }
    });
}

// ===================================
// Drag and Drop Setup
// ===================================
function setupDragAndDrop() {
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!isConverting) {
            elements.uploadArea.classList.add('drag-over');
        }
    }, { passive: false });

    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('drag-over');
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('drag-over');

        if (!isConverting) {
            const file = e.dataTransfer.files[0];
            if (file) {
                handleFileSelection(file);
            }
        }
    }, { passive: false });
}

// ===================================
// Handle File Selection
// ===================================
function handleFileSelection(file) {
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = FILE_FORMATS[currentCategory].extensions;

    // Strict check if input has accept attribute set to specific extension
    const acceptedAttr = elements.fileInput.getAttribute('accept');
    if (acceptedAttr && acceptedAttr !== 'image/*' && acceptedAttr !== 'video/*' && acceptedAttr !== 'audio/*') {
        const strictExt = acceptedAttr.replace('.', '').toLowerCase();
        if (fileExtension !== strictExt) {
            showError(`Incorrect file type. Please select a ${strictExt.toUpperCase()} file.`);
            return;
        }
    } else if (!allowedExtensions.includes(fileExtension)) {
        showError(`Unsupported file type. Please select: ${FILE_FORMATS[currentCategory].description}`);
        return;
    }

    // Save selected file
    selectedFile = file;

    // Show file info
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);

    // Hide upload area, show info
    elements.uploadArea.style.display = 'none';
    elements.fileInfo.style.display = 'flex';
    elements.formatSelection.style.display = 'flex';
    elements.convertBtn.style.display = 'flex';

    // Auto set "from" format
    elements.fromFormat.value = fileExtension;

    // Hide messages
    hideMessages();
}

// ===================================
// Remove File Setup
// ===================================
function setupRemoveFile() {
    elements.removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileSelection();
    });
}

// ===================================
// Reset Selection
// ===================================
function resetFileSelection() {
    selectedFile = null;
    elements.fileInput.value = '';
    elements.uploadArea.style.display = 'block';
    elements.fileInfo.style.display = 'none';
    elements.formatSelection.style.display = 'none';
    elements.convertBtn.style.display = 'none';
    hideMessages();
}

// ===================================
// Update Format Options
// ===================================
function updateFormatOptions() {
    const formats = FILE_FORMATS[currentCategory].extensions;

    // Update "From" list
    elements.fromFormat.innerHTML = '<option value="">Auto</option>';
    formats.forEach(format => {
        const option = document.createElement('option');
        option.value = format;
        option.textContent = format.toUpperCase();
        elements.fromFormat.appendChild(option);
    });

    // Update "To" list
    elements.toFormat.innerHTML = '<option value="">Select Format</option>';
    formats.forEach(format => {
        const option = document.createElement('option');
        option.value = format;
        option.textContent = format.toUpperCase();
        elements.toFormat.appendChild(option);
    });
}

// ===================================
// Convert Button Setup
// ===================================
function setupConvertButton() {
    elements.convertBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            showError('Please select a file first');
            return;
        }

        const outputFormat = elements.toFormat.value;
        if (!outputFormat) {
            showError('Please select an output format');
            return;
        }

        await convertFile(selectedFile, outputFormat);
    });
}

// ===================================
// Convert File
// ===================================
async function convertFile(file, outputFormat) {
    if (isConverting) return;

    isConverting = true;
    hideMessages();

    elements.convertBtn.style.display = 'none';
    elements.progressContainer.style.display = 'block';
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = 'Uploading...';

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('outputFormat', outputFormat);
        formData.append('category', currentCategory);

        updateProgress(30, 'Converting...');

        const response = await fetch('http://localhost:3000/api/convert', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Conversion Failed');
        }

        updateProgress(70, 'Downloading...');

        const blob = await response.blob();

        updateProgress(100, 'Complete!');

        const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
        const downloadName = `${originalName}_converted.${outputFormat}`;
        downloadFile(blob, downloadName);

        setTimeout(() => {
            elements.progressContainer.style.display = 'none';
            elements.successMessage.style.display = 'flex';

            setTimeout(() => {
                resetFileSelection();
                isConverting = false;
            }, 3000);
        }, 500);

    } catch (error) {
        console.error('Conversion Error:', error);
        elements.progressContainer.style.display = 'none';

        let errorMessage = 'An error occurred. Please try again.';

        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            errorMessage = '⚠️ Server Connection Failed!\n\n' +
                '1️⃣ Make sure Node.js is installed\n' +
                '2️⃣ Run: npm install\n' +
                '3️⃣ Run: npm start';
        } else if (error.message) {
            errorMessage = error.message;
        }

        showError(errorMessage);
        elements.convertBtn.style.display = 'flex';
        isConverting = false;
    }
}

// ===================================
// Update Progress
// ===================================
function updateProgress(percentage, text) {
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = text;
}

// ===================================
// Download File
// ===================================
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ===================================
// Show Error
// ===================================
function showError(message) {
    const formattedMessage = message.replace(/\n/g, '<br>');
    elements.errorText.innerHTML = formattedMessage;
    elements.errorMessage.style.display = 'flex';

    setTimeout(() => {
        elements.errorMessage.style.display = 'none';
    }, 10000);
}

// ===================================
// Hide Messages
// ===================================
function hideMessages() {
    elements.successMessage.style.display = 'none';
    elements.errorMessage.style.display = 'none';
    elements.progressContainer.style.display = 'none';
}

// ===================================
// Format File Size
// ===================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

document.addEventListener('DOMContentLoaded', () => {
    init();

    // ===================================
    // Canvas Constellation Network Animation
    // ===================================
    const canvas = document.getElementById('bgCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        let width, height;
        let particles = [];

        // Mouse interaction
        let mouse = {
            x: -1000,
            y: -1000,
            radius: 150
        };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        // Config for Constellation Effect
        let config = {
            particleCount: 100,
            connectionDist: 120, // Distance to draw lines
            color: '6, 182, 212', // RGB for Cyan (#06b6d4)
            speed: 0.6
        };

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;

            // Responsive Configuration
            if (width < 768) {
                config.particleCount = 50;
                config.connectionDist = 80;
                mouse.radius = 0; // Disable mouse effect on mobile
            } else {
                config.particleCount = 100;
                config.connectionDist = 120;
                mouse.radius = 200;
            }

            initParticles();
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < config.particleCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * config.speed,
                    vy: (Math.random() - 0.5) * config.speed
                });
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            // Update & Draw Particles
            particles.forEach(p => {
                // Movement
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Mouse Interaction (Repulsion)
                if (mouse.radius > 0) {
                    let dx = mouse.x - p.x;
                    let dy = mouse.y - p.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < mouse.radius) {
                        let force = (mouse.radius - dist) / mouse.radius;
                        let directionX = dx / dist;
                        let directionY = dy / dist;
                        p.x -= directionX * force * 5;
                        p.y -= directionY * force * 5;
                    }
                }

                // Draw Dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${config.color}, 0.6)`;
                ctx.fill();
            });

            // Draw Connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    let p1 = particles[i];
                    let p2 = particles[j];
                    let dx = p1.x - p2.x;
                    let dy = p1.y - p2.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < config.connectionDist) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${config.color}, ${1 - dist / config.connectionDist})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animate);
        }

        // Start
        window.addEventListener('resize', resize);
        resize();
        animate();
    }
});
