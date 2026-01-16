import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
            <h2 className="text-4xl font-bold mb-4">Not Found</h2>
            <p className="text-zinc-400 mb-8">Could not find requested resource</p>
            <Link
                href="/"
                className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-medium transition-colors"
            >
                Return Home
            </Link>
        </div>
    );
}
