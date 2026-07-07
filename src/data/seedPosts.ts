import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const sampleDiscussions = [
  {
    type: 'discussion',
    title: 'Understanding Compound Interest: The 8th Wonder of the World',
    author: 'Aarav Sharma',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>Did you know that if you invest NPR 10,000 per month at a 12% annual return, you'll have over NPR 1 crore in just 20 years? That's the power of compound interest!</p>
<p>Here's the breakdown:</p>
<ul>
<li><strong>Year 1-5:</strong> Your money grows slowly - NPR 8.5 lakhs</li>
<li><strong>Year 5-10:</strong> Things start picking up - NPR 23 lakhs</li>
<li><strong>Year 10-15:</strong> The magic happens - NPR 50 lakhs</li>
<li><strong>Year 15-20:</strong> Exponential growth - NPR 1.02 crores</li>
</ul>
<p>The key takeaway? Start early, be consistent, and let time do the heavy lifting. Even small amounts matter when compounded over decades.</p>
<p>What's your experience with long-term investing? Share below!</p>`,
    abstract: 'Learn how compound interest can turn regular savings into wealth over time.',
    likes: 47,
    commentCount: 23,
    engagementScore: 70,
    createdAt: serverTimestamp(),
  },
  {
    type: 'discussion',
    title: 'NEPSE Index Analysis: Why Banking Sector Dominates Nepal\'s Stock Market',
    author: 'Pranish Koirala',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>The Nepal Stock Exchange (NEPSE) index is heavily influenced by banking stocks. Let's dive into why this matters for investors.</p>
<p><strong>Key Facts:</strong></p>
<ul>
<li>Commercial banks make up over 40% of NEPSE market cap</li>
<li>The top 5 banks account for 60% of banking sector trading volume</li>
<li>Banking sector P/E ratio averages 12-15x, lower than global peers</li>
</ul>
<p><strong>What This Means for Investors:</strong></p>
<p>When NRB announces monetary policy changes, banking stocks move first. The recent relaxation of margin lending rules saw Nabil Bank jump 8% in a single day.</p>
<p><strong>My Strategy:</strong> I keep 60% of my portfolio in quality banking stocks like Nabil, NICA, and SANIMA. They offer stability plus regular dividends averaging 15-20% annually.</p>
<p>What's your take on banking sector exposure?</p>`,
    abstract: 'Deep dive into why banking stocks dominate NEPSE and how to capitalize on it.',
    likes: 62,
    commentCount: 31,
    engagementScore: 93,
    createdAt: serverTimestamp(),
  },
  {
    type: 'discussion',
    title: 'Personal Budgeting 101: The 50/30/20 Rule That Changed My Life',
    author: 'Sita Thapa',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>After struggling with savings for years, I discovered the 50/30/20 budgeting rule and it completely transformed my financial life.</p>
<p><strong>The Rule:</strong></p>
<ul>
<li><strong>50% Needs:</strong> Rent, groceries, utilities, transportation, insurance</li>
<li><strong>30% Wants:</strong> Dining out, entertainment, shopping, travel</li>
<li><strong>20% Savings:</strong> Emergency fund, investments, debt repayment</li>
</ul>
<p><strong>My Results After 1 Year:</strong></p>
<p>Starting salary: NPR 45,000/month</p>
<p>Monthly savings: NPR 9,000 (20%)</p>
<p>After 12 months: NPR 108,000 + NPR 15,000 interest = NPR 123,000</p>
<p>I created a simple Google Sheet to track everything. The key is automating your savings - set up auto-transfer on payday!</p>
<p>Anyone else using this method? What percentage works for you?</p>`,
    abstract: 'How the 50/30/20 budgeting rule can help you save consistently.',
    likes: 89,
    commentCount: 45,
    engagementScore: 134,
    createdAt: serverTimestamp(),
  },
  {
    type: 'discussion',
    title: 'Hydropower Stocks: Nepal\'s Green Energy Goldmine?',
    author: 'Bikash Gurung',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>Nepal has huge hydropower potential - over 83,000 MW! But only 2,800 MW is currently developed. Is this an opportunity for stock investors?</p>
<p><strong>Top Hydropower Stocks to Watch:</strong></p>
<ul>
<li><strong>Chilime (CHL):</strong> 22.5 MW, consistent performer, 18% ROE</li>
<li><strong>Arun Valley (AHPC):</strong> 60 MW, strong management</li>
<li><strong>Upper Tamakoshi (UPPER):</strong> 456 MW, largest under construction</li>
</ul>
<p><strong>Risks to Consider:</strong></p>
<ul>
<li>Construction delays are common in Nepal</li>
<li>Water dependency - drought years hurt revenue</li>
<li>Political uncertainty can delay projects</li>
</ul>
<p>My analysis suggests hydropower stocks are undervalued relative to their long-term potential. I've allocated 15% of my portfolio to this sector.</p>
<p>What's your view on Nepal's hydropower potential?</p>`,
    abstract: 'Analyzing hydropower stocks as a long-term investment opportunity in Nepal.',
    likes: 38,
    commentCount: 19,
    engagementScore: 57,
    createdAt: serverTimestamp(),
  },
  {
    type: 'discussion',
    title: 'Building an Emergency Fund: Your First Step to Financial Freedom',
    author: 'Anisha Rai',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>Before you start investing, you need an emergency fund. This is non-negotiable!</p>
<p><strong>Why You Need One:</strong></p>
<ul>
<li>Medical emergencies can cost NPR 50,000-500,000+</li>
<li>Job loss can happen unexpectedly</li>
<li>Car repairs, home maintenance, family emergencies</li>
</ul>
<p><strong>How Much Do You Need?</strong></p>
<ul>
<li><strong>Minimum:</strong> 3 months of essential expenses</li>
<li><strong>Recommended:</strong> 6 months of essential expenses</li>
<li><strong>Ideal:</strong> 12 months of essential expenses</li>
</ul>
<p><strong>Where to Keep It:</strong></p>
<ul>
<li>Savings account (accessible but low interest)</li>
<li>Fixed deposit (better returns, 7-9% in Nepal)</li>
<li>Money market fund (best of both worlds)</li>
</ul>
<p>I started with NPR 500/month and now have 6 months saved. It took 2 years but the peace of mind is priceless!</p>`,
    abstract: 'Why an emergency fund is crucial and how to build one step by step.',
    likes: 71,
    commentCount: 38,
    engagementScore: 109,
    createdAt: serverTimestamp(),
  },
  {
    type: 'discussion',
    title: 'Insurance in Nepal: Term vs Endowment - Which is Better?',
    author: 'Rajesh Maharjan',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>Many Nepalis confuse insurance with investment. Let's clear that up!</p>
<p><strong>Term Insurance:</strong></p>
<ul>
<li>Coverage: NPR 50 lakhs for 20 years</li>
<li>Cost: NPR 5,000-8,000/year (for 30-year-old)</li>
<li>Benefit: Pure protection, nothing else</li>
</ul>
<p><strong>Endowment Policy:</strong></p>
<ul>
<li>Coverage: NPR 50 lakhs for 20 years</li>
<li>Cost: NPR 25,000-30,000/year</li>
<li>Benefit: Returns 3-4% (barely beats inflation)</li>
</ul>
<p><strong>The Math:</strong></p>
<p>If you invest the difference (NPR 20,000/year) in mutual funds at 12% returns, you'd have NPR 16 lakhs after 20 years. Endowment would give you only NPR 12 lakhs.</p>
<p><strong>My Recommendation:</strong> Buy term insurance + invest the difference. You get better coverage AND better returns.</p>
<p>What's your experience with insurance products in Nepal?</p>`,
    abstract: 'Comparing term and endowment insurance to help you make informed decisions.',
    likes: 54,
    commentCount: 27,
    engagementScore: 81,
    createdAt: serverTimestamp(),
  },
  {
    type: 'discussion',
    title: 'Mutual Funds in Nepal: A Beginner\'s Guide to Starting Small',
    author: 'Karma Lama',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>Think you need lakhs to start investing? Think again! Mutual funds let you start with just NPR 1,000.</p>
<p><strong>What Are Mutual Funds?</strong></p>
<ul>
<li>Pooled investment managed by professionals</li>
<li>Diversified across stocks, bonds, and securities</li>
<li>Low minimum investment requirement</li>
</ul>
<p><strong>Top Mutual Funds in Nepal:</strong></p>
<ul>
<li><strong>NIBL Growth Fund:</strong> 15.2% average annual return</li>
<li><strong>Siddhartha Equity Fund:</strong> Strong track record</li>
<li><strong>NIC Asia Growth Fund:</strong> Good for beginners</li>
</ul>
<p><strong>How to Start:</strong></p>
<ol>
<li>Open a DEMAT account (any bank)</li>
<li>Choose a mutual fund scheme</li>
<li>Invest via SIP (Systematic Investment Plan)</li>
<li>Start with NPR 1,000-5,000/month</li>
</ol>
<p>I started with NPR 2,000/month and after 3 years, I have NPR 95,000. The power of compounding is real!</p>`,
    abstract: 'How to start investing in mutual funds with as little as NPR 1,000.',
    likes: 93,
    commentCount: 52,
    engagementScore: 145,
    createdAt: serverTimestamp(),
  },
  {
    type: 'discussion',
    title: 'Gold vs Stocks: Where Should Nepalis Invest in 2024?',
    author: 'Deepak Shrestha',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>Gold has been traditional safe haven for Nepalis. But is it still the best option?</p>
<p><strong>Gold Performance (Last 10 Years):</strong></p>
<ul>
<li>Average annual return: 8-10%</li>
<li>Current price: NPR 13,500/gram</li>
<li>Liquidity: High (easy to sell)</li>
</ul>
<p><strong>NEPSE Performance (Last 10 Years):</strong></p>
<ul>
<li>Average annual return: 12-15%</li>
<li>Current index: ~2,800 points</li>
<li>Liquidity: Medium (depends on market)</li>
</ul>
<p><strong>My Analysis:</strong></p>
<ul>
<li>Gold is better for short-term (1-3 years)</li>
<li>Stocks win for long-term (5+ years)</li>
<li>Best strategy: 70% stocks, 30% gold</li>
</ul>
<p>I've shifted from 100% gold to 70/30 split and my returns have improved significantly.</p>
<p>What's your asset allocation strategy?</p>`,
    abstract: 'Comparing gold and stocks to determine the best investment for Nepalis.',
    likes: 67,
    commentCount: 34,
    engagementScore: 101,
    createdAt: serverTimestamp(),
  },
  {
    type: 'discussion',
    title: 'Tax Planning for Salaried Employees in Nepal: Save Legally!',
    author: 'Priya Adhikari',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>Did you know you can save up to NPR 50,000 in taxes legally? Here's how!</p>
<p><strong>Tax Deductions Available:</strong></p>
<ul>
<li><strong>Section 88B:</strong> NPR 20,000 for insurance premium</li>
<li><strong>Section 88C:</strong> NPR 20,000 for provident fund</li>
<li><strong>Section 88D:</strong> NPR 10,000 for education loan interest</li>
</ul>
<p><strong>Example Calculation:</strong></p>
<p>Salary: NPR 80,000/month = NPR 960,000/year</p>
<p>Taxable without deductions: NPR 960,000</p>
<p>Tax after deductions: NPR 810,000</p>
<p>Tax saved: NPR 22,500 (at 15% rate)</p>
<p><strong>Pro Tips:</strong></p>
<ul>
<li>Invest in provident fund for long-term wealth AND tax savings</li>
<li>Keep all receipts for insurance payments</li>
<li>Claim education loan interest if applicable</li>
</ul>
<p>Don't leave money on the table!</p>`,
    abstract: 'Legal ways to reduce your tax liability as a salaried employee in Nepal.',
    likes: 108,
    commentCount: 56,
    engagementScore: 164,
    createdAt: serverTimestamp(),
  },
  {
    type: 'discussion',
    title: 'IPO Investment Strategy: How to Apply and When to Hold',
    author: 'Sanjay Bhattarai',
    authorId: 'system-seed',
    category: 'Finance',
    content: `<p>Nepal's IPO market has been booming. Here's how to make the most of it.</p>
<p><strong>Recent IPO Performance:</strong></p>
<ul>
<li>Hydropower IPOs: Average 150% first-day gain</li>
<li>Finance company IPOs: Average 50-80% first-day gain</li>
<li>Manufacturing IPOs: Average 30-50% first-day gain</li>
</ul>
<p><strong>My IPO Strategy:</strong></p>
<ol>
<li><strong>Apply for all IPOs:</strong> Even small gains add up</li>
<li><strong>Hold quality companies:</strong> Don't sell on day 1 if fundamentals are strong</li>
<li><strong>Research the company:</strong> Look at promoters, business model, and financials</li>
</ol>
<p><strong>Red Flags to Watch:</strong></p>
<ul>
<li>High promoter holding (>70%) - might dump later</li>
<li>Unclear business model</li>
<li>Overvalued compared to peers</li>
</ul>
<p>I've applied to 15 IPOs this year and got allotted in 8. Total profit: NPR 45,000!</p>
<p>What's your IPO success rate?</p>`,
    abstract: 'Strategies for successful IPO investing in the Nepal market.',
    likes: 76,
    commentCount: 41,
    engagementScore: 117,
    createdAt: serverTimestamp(),
  },
];

export async function seedDiscussionPosts() {
  console.log('Seeding discussion posts...');
  
  for (const post of sampleDiscussions) {
    try {
      await addDoc(collection(db, 'posts'), post);
      console.log(`✓ Added: ${post.title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`✗ Failed to add: ${post.title}`, error);
    }
  }
  
  console.log('Done seeding discussion posts!');
}
