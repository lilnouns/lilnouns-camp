const templateDefinitions = {
  "public-goods": {
    title: "Public Goods Template",
    description:
      "Outline public goods projects with implementation and budget details",
    sections: [
      {
        title: "Project Overview",
        placeholder:
          "Provide a clear, concise description of your public goods project. What problem does it solve? Who benefits from it in the Lil Nouns ecosystem and broader community?",
      },
      {
        title: "Project Details & Implementation",
        placeholder:
          "Detail how you will implement this project. For infrastructure: materials, construction, permits. For education: curriculum, delivery method. For community spaces: location, setup, accessibility. For environmental: methodology, impact measurement.",
      },
      {
        title: "Community Access & Sustainability",
        placeholder:
          "How will the community access and benefit from this public good? Will it be freely available? How will you ensure long-term sustainability and maintenance? Consider ongoing costs and community involvement.",
      },
      {
        title: "Budget Breakdown",
        placeholder:
          "Provide detailed budget breakdown including all project costs: materials, labor, permits, equipment, ongoing maintenance, insurance, and any other expenses. Be specific about one-time vs recurring costs.",
      },
      {
        title: "Timeline & Milestones",
        placeholder:
          "Outline your project timeline with specific milestones and deliverables. Include key phases like planning, permits/approvals, implementation, and launch.",
      },
      {
        title: "Team & Qualifications",
        placeholder:
          "Introduce your team members and their relevant experience for this project. Include any certifications, previous similar projects, or partnerships with local organizations/contractors.",
      },
    ],
  },
  development: {
    title: "Development / Software Template",
    description:
      "Plan software projects with technical, licensing, and budget details",
    sections: [
      {
        title: "Project Description",
        placeholder:
          "Describe your software project. What does it do? What problem does it solve for the Lil Nouns ecosystem?",
      },
      {
        title: "Technical Architecture",
        placeholder:
          "Explain the technical architecture, tech stack, and development approach.",
      },
      {
        title: "Licensing Strategy",
        placeholder:
          "What licensing will you utilize? Open source? Proprietary? How will this benefit the community?",
      },
      {
        title: "Development Timeline",
        placeholder:
          "Provide a detailed development timeline with milestones and deliverables.",
      },
      {
        title: "Budget & Resources",
        placeholder:
          "Break down development costs, infrastructure needs, and ongoing maintenance.",
      },
      {
        title: "Post-Launch Support",
        placeholder:
          "How will you maintain and support the software after launch?",
      },
    ],
  },
  "arts-creative": {
    title: "Arts / Creative Template",
    description:
      "Propose art or creative projects with vision, process, and community engagement",
    sections: [
      {
        title: "Creative Vision",
        placeholder:
          "Describe your creative project. What's your artistic vision? How does it align with Lil Nouns culture?",
      },
      {
        title: "Creative Process",
        placeholder:
          "Explain your creative process, techniques, and artistic approach.",
      },
      {
        title: "CC0 & Rights",
        placeholder:
          "Will your creations be CC0? How will you handle intellectual property and community usage rights?",
      },
      {
        title: "Distribution Strategy",
        placeholder:
          "How will you distribute your work? Consider Zora, social media, exhibitions, etc.",
      },
      {
        title: "Budget & Materials",
        placeholder:
          "Detail costs for materials, tools, software, and any other creative resources needed.",
      },
      {
        title: "Community Engagement",
        placeholder:
          "How will you engage with the Lil Nouns community throughout the creative process?",
      },
    ],
  },
  "irl-event": {
    title: "IRL Event Template",
    description:
      "Plan real-world events including logistics, promotion, and success metrics",
    sections: [
      {
        title: "Event Overview",
        placeholder:
          "Describe your IRL event. What type of event is it? What's the purpose and how does it benefit the Lil Nouns community?",
      },
      {
        title: "Event Details",
        placeholder:
          "Provide specific details: date, location, duration, expected attendance, format (conference, meetup, workshop, etc.)",
      },
      {
        title: "Target Audience",
        placeholder:
          "Who is the target audience? How will you attract Lil Nouns community members and other relevant attendees?",
      },
      {
        title: "Budget Breakdown",
        placeholder:
          "Detail all costs: venue rental, catering, speakers, marketing, materials, staff, insurance, and contingency funds.",
      },
      {
        title: "Marketing & Promotion",
        placeholder:
          "How will you promote the event? What channels will you use to reach the community and ensure good attendance?",
      },
      {
        title: "Success Metrics",
        placeholder:
          "How will you measure the success of the event? What are your goals for attendance, engagement, and community impact?",
      },
    ],
  },
  "conference-sponsorship": {
    title: "Conference Sponsorship Template",
    description:
      "Request conference sponsorships with activation and ROI details",
    sections: [
      {
        title: "Conference Details",
        placeholder:
          "Provide details about the conference: name, dates, location, expected attendance, and relevance to web3/NFT/DAO space.",
      },
      {
        title: "Sponsorship Package",
        placeholder:
          "What sponsorship tier are you requesting? What benefits does Lil Nouns receive (booth space, speaking slots, branding, etc.)?",
      },
      {
        title: "Community Value",
        placeholder:
          "How does this sponsorship benefit the Lil Nouns community? Will there be networking opportunities, educational content, or brand exposure?",
      },
      {
        title: "Activation Plan",
        placeholder:
          "How will you activate the sponsorship? Will you host a booth, give talks, organize meetups, or create special content?",
      },
      {
        title: "Budget & ROI",
        placeholder:
          "Break down the sponsorship costs and explain the expected return on investment for the Lil Nouns brand and community.",
      },
      {
        title: "Reporting & Follow-up",
        placeholder:
          "How will you report back to the community? What metrics will you track and share post-conference?",
      },
    ],
  },
  "physical-goods": {
    title: "Physical Goods Template",
    description:
      "Propose physical merchandise with production and distribution plans",
    sections: [
      {
        title: "Product Description",
        placeholder:
          "Describe the physical goods you want to create. What are they? How do they represent or promote Lil Nouns?",
      },
      {
        title: "Design & Branding",
        placeholder:
          "Explain the design concept. How will you incorporate Lil Nouns branding? Will designs be CC0? Include mockups if available.",
      },
      {
        title: "Production Plan",
        placeholder:
          "Detail your production process: manufacturers, materials, quality control, timeline from design to delivery.",
      },
      {
        title: "Distribution Strategy",
        placeholder:
          "How will you distribute the goods? Direct sales, giveaways, events, online store? What's your fulfillment plan?",
      },
      {
        title: "Budget & Pricing",
        placeholder:
          "Break down all costs: design, production, shipping, storage, platform fees. What will be the pricing strategy?",
      },
      {
        title: "Community Impact",
        placeholder:
          "How do these physical goods benefit the Lil Nouns community? Will proceeds support the DAO or other initiatives?",
      },
    ],
  },
  "charity-donations": {
    title: "Charity / Donations Template",
    description:
      "Structure charitable initiatives with impact and reporting plans",
    sections: [
      {
        title: "Charitable Cause",
        placeholder:
          "Describe the charitable cause or organization. What is their mission? Why is this cause important to the Lil Nouns community?",
      },
      {
        title: "Organization Details",
        placeholder:
          "Provide details about the charity: registration status, track record, leadership, and how they use donations effectively.",
      },
      {
        title: "Donation Impact",
        placeholder:
          "Explain how the donation will be used. What specific impact will this funding have? Include measurable outcomes if possible.",
      },
      {
        title: "Community Alignment",
        placeholder:
          "How does this charitable initiative align with Lil Nouns values? Will it help build positive brand association?",
      },
      {
        title: "Transparency & Reporting",
        placeholder:
          "How will you ensure transparency? What reporting will you provide to show how funds were used and impact achieved?",
      },
      {
        title: "Recognition & Promotion",
        placeholder:
          "How will the donation be recognized? Will there be promotional opportunities that benefit both the charity and Lil Nouns?",
      },
    ],
  },
  "marketing-media": {
    title: "Marketing / Advertising / Media Template",
    description:
      "Plan marketing campaigns with audience and KPI considerations",
    sections: [
      {
        title: "Campaign Overview",
        placeholder:
          "Describe your marketing campaign. What are the objectives? What message do you want to communicate about Lil Nouns?",
      },
      {
        title: "Target Audience",
        placeholder:
          "Who is your target audience? Demographics, interests, platforms they use. How will this expand or engage the Lil Nouns community?",
      },
      {
        title: "Creative Strategy",
        placeholder:
          "Explain your creative approach. What type of content will you create? How will it represent Lil Nouns brand and values?",
      },
      {
        title: "Media Channels",
        placeholder:
          "Which platforms and channels will you use? Social media, traditional advertising, influencer partnerships, PR, etc.?",
      },
      {
        title: "Budget & Timeline",
        placeholder:
          "Break down costs for creative development, media buying, influencer fees, and management. Include campaign timeline.",
      },
      {
        title: "Success Metrics",
        placeholder:
          "How will you measure success? Include KPIs like reach, engagement, conversions, brand awareness, or community growth.",
      },
    ],
  },
  "defi-treasury": {
    title: "DeFi / Treasury Management Template",
    description: "Present treasury strategies with risk and return analysis",
    sections: [
      {
        title: "Strategy Overview",
        placeholder:
          "Describe your DeFi or treasury management strategy. What are the goals? How does this benefit the Lil Nouns treasury?",
      },
      {
        title: "Protocols & Platforms",
        placeholder:
          "Which DeFi protocols or platforms will you use? Explain why these are suitable and what due diligence you've performed.",
      },
      {
        title: "Risk Assessment",
        placeholder:
          "Detail the risks involved: smart contract risk, impermanent loss, market volatility, etc. How will you mitigate these risks?",
      },
      {
        title: "Expected Returns",
        placeholder:
          "What returns do you expect? Provide realistic projections based on historical data and current market conditions.",
      },
      {
        title: "Management & Monitoring",
        placeholder:
          "How will you actively manage the positions? What monitoring tools and processes will you use? Who has access?",
      },
      {
        title: "Exit Strategy",
        placeholder:
          "What's your exit strategy? Under what conditions would you unwind positions? How will you report performance to the DAO?",
      },
    ],
  },
};

const toBody = (sections) =>
  sections
    .map(({ title, placeholder }) => `## ${title}\n${placeholder}\n`)
    .join("\n");

export const proposalTemplates = [
  ...Object.entries(templateDefinitions).map(
    ([id, { title, description, sections }]) => ({
      id,
      name: title,
      description,
      defaults: {
        name: "Proposal Title",
        body: toBody(sections),
        actions: [],
      },
    }),
  ),
  {
    id: "blank",
    name: "Blank Proposal",
    description: "Start from an empty draft",
    defaults: { name: "Proposal Title", body: "", actions: [] },
  },
];

export default proposalTemplates;
