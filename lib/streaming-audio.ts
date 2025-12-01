export class AudioBuffer {
    private chunks: Buffer[] = []
    private lastSpeechTime: number = Date.now()
    private silenceThreshold: number = 0.01 // Adjusted for better detection
    private minSilenceDuration: number = 1500 // Reduced to 1.5 seconds (more responsive)
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
}

export function detectSilence(buffer: AudioBuffer): boolean {
    const bufferSize = buffer.getSize();
    const timeSinceLastSpeech = buffer.getTimeSinceLastSpeech();
    const minSilenceDuration = buffer.getMinSilenceDuration();

    // Minimum buffer size (0.5 seconds of audio at 16kHz)
    const minBufferSize = 16000; // More responsive
    if (bufferSize < minBufferSize) {
        return false;
    }

    // Check if enough silence time has passed
    const isSilent = timeSinceLastSpeech >= minSilenceDuration;

    // Maximum buffer size (prevent infinite buffering - 10 seconds max)
    const maxBufferSize = 320000;
    const bufferTooLarge = bufferSize > maxBufferSize;

    return isSilent || bufferTooLarge;
}
