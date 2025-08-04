
class TextToSpeechService {
    private synth: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private femaleVoice: SpeechSynthesisVoice | null = null;
    private hindiVoice: SpeechSynthesisVoice | null = null;

    constructor() {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = this.loadVoices;
        }
    }

    private loadVoices = () => {
        this.voices = this.synth.getVoices();
        // Find a preferred English female voice
        this.femaleVoice = this.voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.includes('Female') || /Google US English|Zira|Susan|Ava/.test(v.name))
        ) || this.voices.find(v => v.lang.startsWith('en')) || null;

        // Find a Hindi voice
        this.hindiVoice = this.voices.find(v => v.lang.startsWith('hi')) || null;
    }

    public speak(text: string, lang: 'en' | 'hi' = 'en'): void {
        if (!text || typeof text !== 'string') {
            console.error('TTS Error: No text to speak.');
            return;
        }

        // Stop any currently speaking utterance
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        // A short delay to ensure cancel has finished
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(this.stripHtml(text));
            
            // Select voice based on language
            const selectedVoice = (lang === 'hi' && this.hindiVoice) ? this.hindiVoice : this.femaleVoice;
            
            utterance.voice = selectedVoice;
            utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
            utterance.pitch = 1;
            utterance.rate = 1;

            this.synth.speak(utterance);
        }, 100);
    }

    public stop(): void {
        this.synth.cancel();
    }

    private stripHtml(html: string): string {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    }
}

export const tts = new TextToSpeechService();
