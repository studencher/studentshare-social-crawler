import crypto from 'crypto';

export function generateUniqueId(content) {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
}
