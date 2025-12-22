export class AudioBuffer {
    private chunks: Buffer[] = []
    private lastSpeechTime: number = Date.now()
    private silenceThreshold: number = 0.02 // Increased threshold to reduce false positives
    private minSilenceDuration: number = 1500 // 1.5 seconds for more reliable detection
    private lastChunkTime: number = Date.now()

    addChunk(chunk: Buffer) {
        this.chunks.push(chunk)
        this.lastChunkTime = Date.now()

        // Calculate energy of this chunk
        const energy = this.calculateEnergy(chunk)

        // If energy above threshold, update last speech time
        if (energy > this.silenceThreshold) {
            this.lastSpeechTime = Date.now()
        }
    }

    getAudio(): Buffer {
        return Buffer.concat(this.chunks)
    }

    clear() {
        this.chunks = []
        this.lastSpeechTime = Date.now()
        this.lastChunkTime = Date.now()
    }

    getSize(): number {
        return this.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    }

    getTimeSinceLastSpeech(): number {
        return Date.now() - this.lastSpeechTime
    }

    getMinSilenceDuration(): number {
        return this.minSilenceDuration
    }

    // Calculate RMS (Root Mean Square) energy of audio chunk
    private calculateEnergy(chunk: Buffer): number {
        if (chunk.length === 0) return 0

        let sum = 0
        // Process 16-bit PCM audio
        for (let i = 0; i < chunk.length - 1; i += 2) {
            const sample = chunk.readInt16LE(i) / 32768.0
            sum += sample * sample
        }

        const rms = Math.sqrt(sum / (chunk.length / 2))
        return rms
    }

    // Check if buffer contains actual speech (not just background noise)
    // NOTE: Currently disabled in favor of transcription-based filtering
    hasSpeech(): boolean {
        const audio = this.getAudio();
        if (audio.length === 0) return false;

        // Calculate average energy of entire buffer
        let sum = 0;
        for (let i = 0; i < audio.length - 1; i += 2) {
            const sample = audio.readInt16LE(i) / 32768.0;
            sum += sample * sample;
        }
        const avgEnergy = Math.sqrt(sum / (audio.length / 2));

        // Very low threshold - only filter complete silence
        const speechEnergyThreshold = 0.0004;
        return avgEnergy > speechEnergyThreshold;
    }
}

export function detectSilence(buffer: AudioBuffer): boolean {
    const bufferSize = buffer.getSize();
    const timeSinceLastSpeech = buffer.getTimeSinceLastSpeech();
    const minSilenceDuration = buffer.getMinSilenceDuration();

    // Minimum buffer size (1 second of audio at 16kHz) - increased to require more speech
    const minBufferSize = 32000; // 1 second minimum
    if (bufferSize < minBufferSize) {
        return false;
    }

    // Check if buffer actually contains speech (not just background noise)
    if (!buffer.hasSpeech()) {
        // Clear buffer silently if it's just noise - don't process it
        buffer.clear();
        return false;
    }

    // Check if enough silence time has passed
    const isSilent = timeSinceLastSpeech >= minSilenceDuration;

    // Maximum buffer size (prevent infinite buffering - 5 seconds max)
    const maxBufferSize = 160000; // Reduced from 320000 for faster response
    const bufferTooLarge = bufferSize > maxBufferSize;

    return isSilent || bufferTooLarge;
}
