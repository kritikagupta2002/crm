export const DAILY_QUOTES = [
    {
        id: 1,
        line1: 'Mapping',
        line2: 'People Potential',
        category: 'Culture & Vision',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 2,
        line1: 'Unearthing',
        line2: 'True Excellence',
        category: 'Excellence',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 3,
        line1: 'Precision in Data,',
        line2: 'Strength in People',
        category: 'Geo-Analytics',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 4,
        line1: 'Transforming Vision',
        line2: 'Into Ground Reality',
        category: 'Leadership',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 5,
        line1: 'Geoscience Driven,',
        line2: 'People Centered',
        category: 'Core Mission',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 6,
        line1: 'Safety First,',
        line2: 'Excellence Always',
        category: 'Site Safety',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 7,
        line1: 'Building Sustainable',
        line2: 'Mining Horizons',
        category: 'Sustainability',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 8,
        line1: 'From Deep Earth',
        line2: 'To Greater Heights',
        category: 'Growth',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 9,
        line1: 'Pioneering Science,',
        line2: 'Empowering Teams',
        category: 'Teamwork',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 10,
        line1: 'Shaping Resources,',
        line2: 'Securing Futures',
        category: 'Future Focus',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 11,
        line1: 'Integrity Deep,',
        line2: 'Standards High',
        category: 'Values',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 12,
        line1: 'Innovating Today,',
        line2: 'Powering Tomorrow',
        category: 'Innovation',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 13,
        line1: 'Strong Foundations,',
        line2: 'Boundless Ambition',
        category: 'Resilience',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 14,
        line1: 'Every Layer Tells',
        line2: 'A Story of Growth',
        category: 'Exploration',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 15,
        line1: 'Dedication on Site,',
        line2: 'Excellence in Mind',
        category: 'Commitment',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 16,
        line1: 'Collaborative Mindset,',
        line2: 'Unmatched Results',
        category: 'Collaboration',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 17,
        line1: 'Where Curiosity Meets',
        line2: 'Engineering Rigor',
        category: 'Engineering',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 18,
        line1: 'Crafting Solutions,',
        line2: 'Delivering Value',
        category: 'Excellence',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 19,
        line1: 'Deep Expertise,',
        line2: 'Broad Horizons',
        category: 'Knowledge',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 20,
        line1: 'Resilient Spirit,',
        line2: 'Forward Momentum',
        category: 'Energy',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 21,
        line1: 'Empowering Minds,',
        line2: 'Unlocking Potential',
        category: 'Leadership',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 22,
        line1: 'Rooted in Trust,',
        line2: 'Driven by Purpose',
        category: 'Trust',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 23,
        line1: 'Precision Underground,',
        line2: 'Perfection Above',
        category: 'Quality',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 24,
        line1: 'Inspiring Teams,',
        line2: 'Surpassing Goals',
        category: 'Achievement',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 25,
        line1: 'Modern Technology,',
        line2: 'Timeless Values',
        category: 'Technology',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 26,
        line1: 'Together We Explore,',
        line2: 'Together We Excel',
        category: 'Unity',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 27,
        line1: 'Smart Operations,',
        line2: 'Sustainable Future',
        category: 'Sustainability',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 28,
        line1: 'Leading with Insight,',
        line2: 'Building with Care',
        category: 'Insight',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 29,
        line1: 'Courage to Dig Deep,',
        line2: 'Wisdom to Reach High',
        category: 'Aspiration',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 30,
        line1: 'Connecting People,',
        line2: 'Creating Legacy',
        category: 'Heritage',
        author: 'Bansal Geo Solutions',
    },
    {
        id: 31,
        line1: 'Pioneering the Next',
        line2: 'Resource Frontier',
        category: 'Exploration',
        author: 'Bansal Geo Solutions',
    },
];
/**
 * Deterministically returns the daily quote based on the day of the year.
 * Rotates automatically every single day at midnight.
 */
export function getDailyQuote(date = new Date(), offset = 0) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() -
        start.getTime() +
        (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const total = DAILY_QUOTES.length;
    const index = ((dayOfYear + offset) % total + total) % total;
    return DAILY_QUOTES[index];
}
