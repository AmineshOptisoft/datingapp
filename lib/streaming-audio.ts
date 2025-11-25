export class AudioBuffer {
    private chunks: Buffer[] = []

    addChunk(chunk: Buffer) {
        this.chunks.push(chunk)
    }

    getAudio(): Buffer {
        return Buffer.concat(this.chunks)
    }

    clear() {
        this.chunks = []
    }

    getSize(): number {
        return this.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    }
}

export function detectSilence(buffer: AudioBuffer): boolean {
    // Simple silence detection - check if buffer has enough data
    // In production, you'd analyze audio energy levels
    return buffer.getSize() > 32000 // ~2 seconds at 16kHz
}
