class LotteryWheel {
    constructor(drawCode = null, numbers = [], telegramChatId = null) {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.numbers = numbers.length > 0 ? numbers : Array.from({length: 30}, (_, i) => i + 1);
        this.rotation = 0;
        this.isSpinning = false;
        this.drawCode = drawCode;
        this.telegramChatId = telegramChatId;
        this.animationId = null;
        
        // Initialize Telegram WebApp
        if (window.Telegram?.WebApp) {
            try {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
                
                // Set theme colors
                this.setTelegramTheme();
                
                // Handle back button
                window.Telegram.WebApp.BackButton.isVisible = true;
                window.Telegram.WebApp.BackButton.onClick(() => this.handleBack());
                
                // Set viewport
                window.Telegram.WebApp.setHeaderColor('secondary_bg_color');
            } catch (e) {
                console.error('Error initializing Telegram WebApp:', e);
            }
        }
        
        // Setup wheel
        this.setupCanvas();
        this.bindEvents();
        
        // Auto-spin if launched from Telegram
        if (this.drawCode && this.telegramChatId) {
            this.spinButton = document.getElementById('spinButton');
            if (this.spinButton) {
                this.spinButton.style.display = 'none';
                this.autoSpin();
            }
        }
    }

    setTelegramTheme() {
        const root = document.documentElement;
        if (window.Telegram?.WebApp) {
            root.style.setProperty('--tg-theme-bg-color', 
                window.Telegram.WebApp.backgroundColor || '#ffffff');
            root.style.setProperty('--tg-theme-text-color', 
                window.Telegram.WebApp.textColor || '#000000');
            root.style.setProperty('--tg-theme-button-color', 
                window.Telegram.WebApp.buttonColor || '#3390ec');
            root.style.setProperty('--tg-theme-button-text-color', 
                window.Telegram.WebApp.textColor || '#ffffff');
        }
    }

    handleBack() {
        if (this.isSpinning) {
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.showPopup({
                    title: 'Animation in Progress',
                    message: 'Please wait for the wheel animation to complete.',
                    buttons: [{type: 'ok'}]
                });
            }
            return;
        }
        window.close();
    }

    setupCanvas() {
        const container = document.querySelector('.wheel-container');
        const isMobile = window.innerWidth <= 768;
        const size = isMobile ? 
            Math.min(container.offsetWidth - 40, window.innerHeight - 100) : 
            Math.min(container.offsetWidth, 600);
        
        this.canvas.width = size;
        this.canvas.height = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
        this.radius = (size / 2) - 20;
        
        // High DPI display support
        const dpr = window.devicePixelRatio || 1;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.ctx.scale(dpr, dpr);
    }

    bindEvents() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spin());
        }

        // Handle resize and orientation change
        const resizeHandler = () => {
            this.setupCanvas();
            this.drawWheel();
        };
        
        window.addEventListener('resize', resizeHandler);
        window.addEventListener('orientationchange', resizeHandler);
    }

    drawWheel() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const sectionAngle = (Math.PI * 2) / this.numbers.length;
        
        this.numbers.forEach((number, index) => {
            const startAngle = index * sectionAngle + this.rotation;
            const endAngle = startAngle + sectionAngle;
            
            // Draw section
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            this.ctx.closePath();
            
            // Use Telegram theme colors
            const baseColor = window.Telegram?.WebApp?.buttonColor || '#3390ec';
            const altColor = this.adjustColor(baseColor, index % 2 === 0 ? -20 : 20);
            this.ctx.fillStyle = index % 2 === 0 ? baseColor : altColor;
            this.ctx.fill();
            
            // Draw number
            this.ctx.save();
            this.ctx.translate(
                this.centerX + (this.radius * 0.75) * Math.cos(startAngle + sectionAngle/2),
                this.centerY + (this.radius * 0.75) * Math.sin(startAngle + sectionAngle/2)
            );
            this.ctx.rotate(startAngle + sectionAngle/2 + Math.PI/2);
            this.ctx.fillStyle = window.Telegram?.WebApp?.textColor || 'white';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(number.toString(), 0, 0);
            this.ctx.restore();
        });
    }

    adjustColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    async autoSpin() {
        try {
            // Wait for animation to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.spin();
        } catch (error) {
            console.error('Error during auto-spin:', error);
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.showAlert('Failed to start the wheel animation. Please try again.');
            }
        }
    }

    async spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        const duration = 5000;
        
        try {
            // Show loading animation
            this.showLoading(true);
            
            // Get winning number from server
            const response = await fetch(`/draw/${this.drawCode}/spin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telegram_chat_id: this.telegramChatId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get winning number');
            }

            const data = await response.json();
            const targetNumber = data.winner;
            
            // Hide loading animation
            this.showLoading(false);
            
            // Calculate final rotation
            const targetIndex = this.numbers.indexOf(targetNumber);
            const targetAngle = -(Math.PI * 2 / this.numbers.length) * targetIndex - Math.PI/2;
            const extraSpins = Math.PI * 2 * 10; // 10 full rotations
            const targetRotation = targetAngle + extraSpins;
            
            const startTime = performance.now();
            
            // Play spin sound
            if (window.audioManager) {
                audioManager.playSound('spin');
            }
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const easeOut = t => 1 - Math.pow(1 - t, 3);
                const currentRotation = targetRotation * easeOut(progress);
                
                this.rotation = currentRotation;
                this.drawWheel();
                
                if (progress < 1) {
                    this.animationId = requestAnimationFrame(animate);
                } else {
                    this.isSpinning = false;
                    this.showWinner(targetNumber);
                    
                    // Play win sound
                    if (window.audioManager) {
                        audioManager.playSound('win');
                    }
                }
            };
            
            this.animationId = requestAnimationFrame(animate);
        } catch (error) {
            console.error('Error during spin:', error);
            this.isSpinning = false;
            this.showLoading(false);
            
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.showAlert('Failed to complete the draw. Please try again.');
            }
        }
    }

    showLoading(show) {
        let loader = document.querySelector('.loading');
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.className = 'loading';
                this.canvas.parentNode.appendChild(loader);
            }
        } else if (loader) {
            loader.remove();
        }
    }

    showWinner(number) {
        const overlay = document.createElement('div');
        overlay.className = 'winner-overlay';
        overlay.innerHTML = `
            <div class="winner-content">
                <h2>🎉 Winner! 🎉</h2>
                <p>Number: ${number}</p>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Remove overlay and close window if from Telegram
        setTimeout(() => {
            overlay.remove();
            if (this.telegramChatId && window.Telegram?.WebApp) {
                window.Telegram.WebApp.close();
            }
        }, 3000);
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize wheel when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const numbersEl = document.getElementById('wheelNumbers');
    const numbers = numbersEl ? JSON.parse(numbersEl.dataset.numbers) : [];
    const drawCode = document.getElementById('drawCode')?.value;
    const telegramChatId = document.getElementById('telegramChatId')?.value;
    
    try {
        const wheel = new LotteryWheel(drawCode, numbers, telegramChatId);
        wheel.drawWheel();

        // Cleanup on page unload
        window.addEventListener('unload', () => wheel.cleanup());
    } catch (error) {
        console.error('Error initializing wheel:', error);
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.showAlert('Failed to initialize the wheel. Please try again.');
        }
    }
});
