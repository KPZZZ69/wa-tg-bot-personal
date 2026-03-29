const spamKeywords = [
    'offer', 'discount', 'free gift', 'click here', 'buy now', 'subscribe', 
    'lottery', 'crypto', 'investment', 'guaranteed', 'promo', 'coupon'
];

function isSpam(text) {
    if (!text) return false;
    
    let score = 0;
    const lowerText = text.toLowerCase();
    
    spamKeywords.forEach(kw => {
        if (lowerText.includes(kw)) score += 1;
    });

    if (text.includes('http') && score > 0) score += 2;
    
    const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
    if (text.length > 20 && uppercaseCount / text.length > 0.6) score += 2;
    
    if ((text.match(/\\$/g) || []).length > 2) score += 2;

    return score >= 3;
}

module.exports = { isSpam };
