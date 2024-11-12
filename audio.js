class AudioManager {
    constructor() {
        this.isInitialized = false;
        
        // Initialize Tone.js on user interaction
        document.getElementById('spinButton').addEventListener('click', () => {
            if (!this.isInitialized) {
                this.initializeTone();
            }
        });
    }

    async initializeTone() {
        await Tone.start();
        this.isInitialized = true;

        // Create synth for spin sound
        this.spinSynth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.spinSynth.volume.value = -12; // Reduce volume

        // Create synth for win sound
        this.winSynth = new Tone.Synth({
            oscillator: {
                type: "square"
            },
            envelope: {
                attack: 0.05,
                decay: 0.2,
                sustain: 0.3,
                release: 1
            }
        }).toDestination();
        this.winSynth.volume.value = -10;
    }

    playSound(name) {
        if (!this.isInitialized) return;

        if (name === 'spin') {
            // Create a spinning sound effect - descending glissando
            const now = Tone.now();
            const duration = 0.5;
            
            // Play multiple notes for a richer spinning sound
            for (let i = 0; i < 4; i++) {
                const startTime = now + (i * duration / 4);
                this.spinSynth.triggerAttackRelease("C5", "16n", startTime);
                this.spinSynth.triggerAttackRelease("G4", "16n", startTime + 0.1);
            }
            
            // Add a descending frequency sweep
            const filter = new Tone.Filter({
                frequency: 2000,
                type: "lowpass"
            }).toDestination();
            
            this.spinSynth.connect(filter);
            filter.frequency.rampTo(200, duration);
            
            // Cleanup
            setTimeout(() => {
                filter.dispose();
            }, duration * 1000);
            
        } else if (name === 'win') {
            // Create a victory sound effect - ascending arpeggio
            const now = Tone.now();
            
            // Play a happy arpeggio
            this.winSynth.triggerAttackRelease("C4", "8n", now);
            this.winSynth.triggerAttackRelease("E4", "8n", now + 0.1);
            this.winSynth.triggerAttackRelease("G4", "8n", now + 0.2);
            this.winSynth.triggerAttackRelease("C5", "4n", now + 0.3);
        }
    }
}

const audioManager = new AudioManager();
