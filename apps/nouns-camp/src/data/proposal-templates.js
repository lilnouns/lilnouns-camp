/*
  Adapted templates
  Inspired by ideas in lilprops; fully reworded to avoid copying expressive text.
  Notes on safe reuse and derivative works: FSF AGPL/GPL guidance and US Copyright Office circulars.
  See https://www.gnu.org/licenses/gpl-faq.en.html and Circular 14.
*/
export const templateDefinitions = {
  "public-goods": {
    title: "Public Goods Outline",
    description: "Plan public benefit work with scope, delivery, and costs",
    sections: [
      {
        title: "Summary",
        placeholder:
          "State the problem and the public good you will provide. Who benefits in Lil Nouns and beyond, and why it matters now?",
      },
      {
        title: "Delivery Plan",
        placeholder:
          "Describe how it gets built and shipped. For infrastructure list materials, permissions, and build steps. For education outline curriculum and format. For spaces note location, setup, and accessibility. For environmental work explain method and impact tracking.",
      },
      {
        title: "Access & Stewardship",
        placeholder:
          "Explain how people will use it, whether access is open, and how you will fund upkeep. Include recurring costs and roles for community participation.",
      },
      {
        title: "Budget",
        placeholder:
          "Itemize expenses such as materials, labor, equipment, permits, insurance, and maintenance. Separate one-time costs from ongoing costs.",
      },
      {
        title: "Timeline",
        placeholder:
          "Map phases and milestones from planning and approvals to execution and launch, with expected dates or ranges.",
      },
      {
        title: "Team",
        placeholder:
          "List contributors and relevant experience. Mention prior similar work, certifications, or local partners.",
      },
    ],
  },

  development: {
    title: "Software Project Outline",
    description: "Define scope, architecture, license, schedule, and costs",
    sections: [
      {
        title: "Problem & Goals",
        placeholder:
          "What does the software do and which pain points in the Lil Nouns ecosystem does it address?",
      },
      {
        title: "Architecture",
        placeholder:
          "Summarize the system design, stack, modules, data flows, and interfaces.",
      },
      {
        title: "License Plan",
        placeholder:
          "State your licensing choice and rationale. How does it enable community use, contribution, or commercialization?",
      },
      {
        title: "Roadmap",
        placeholder:
          "Provide a milestone plan from prototype to release. Include acceptance criteria for each step.",
      },
      {
        title: "Resourcing & Costs",
        placeholder:
          "Estimate engineering time, infra, tools, and expected maintenance obligations.",
      },
      {
        title: "Operations After Launch",
        placeholder:
          "Explain support policy, update cadence, issue response, and security practices.",
      },
    ],
  },

  "arts-creative": {
    title: "Creative Project Outline",
    description:
      "Capture vision, process, rights, distribution, and community touchpoints",
    sections: [
      {
        title: "Concept",
        placeholder:
          "Describe the idea and how it resonates with Lil Nouns culture or themes.",
      },
      {
        title: "Method",
        placeholder:
          "Explain techniques, tools, and workflow from draft to final output.",
      },
      {
        title: "Rights & Reuse",
        placeholder:
          "State how the work will be licensed, such as CC0 or another approach, and how the community may use it.",
      },
      {
        title: "Release Plan",
        placeholder:
          "Where and how will the work reach people, for example Zora, socials, exhibitions, or other channels.",
      },
      {
        title: "Budget & Inputs",
        placeholder:
          "List materials, tools, software, studio time, and other costs.",
      },
      {
        title: "Community Involvement",
        placeholder:
          "Describe feedback loops, collaboration points, or showcases with the Lil Nouns community.",
      },
    ],
  },

  "irl-event": {
    title: "In-Person Event Plan",
    description: "Organize logistics, outreach, costs, and outcomes",
    sections: [
      {
        title: "Overview",
        placeholder:
          "What kind of event is it, what is the purpose, and how does it serve the Lil Nouns community?",
      },
      {
        title: "Logistics",
        placeholder:
          "Provide date, venue, duration, capacity, and format such as meetup, workshop, or conference.",
      },
      {
        title: "Audience",
        placeholder:
          "Who should attend and how will you reach them inside and outside Lil Nouns?",
      },
      {
        title: "Costs",
        placeholder:
          "Detail venue, catering, speaker fees, promotion, staffing, insurance, and contingency lines.",
      },
      {
        title: "Promotion",
        placeholder:
          "List channels and tactics to drive attendance and engagement before and during the event.",
      },
      {
        title: "Measures of Success",
        placeholder:
          "Define goals and metrics like attendance, satisfaction, engagement, or follow-on activity.",
      },
    ],
  },

  "conference-sponsorship": {
    title: "Conference Sponsorship Plan",
    description: "Request support with clear activation and benefit mapping",
    sections: [
      {
        title: "Conference Snapshot",
        placeholder:
          "Name, dates, location, expected turnout, and relevance to web3, NFTs, or DAOs.",
      },
      {
        title: "Requested Tier",
        placeholder:
          "Which package are you seeking and what benefits are included such as booth, talks, signage, or media.",
      },
      {
        title: "Community Value",
        placeholder:
          "Explain benefits to Lil Nouns such as learning, connections, brand visibility, or onboarding.",
      },
      {
        title: "Activation",
        placeholder:
          "Describe on-site plans like booth operations, talks, meetups, demos, or content capture.",
      },
      {
        title: "Budget & Return",
        placeholder:
          "Show cost breakdown and expected outcomes or ROI for the brand and community.",
      },
      {
        title: "Follow Up",
        placeholder:
          "Commit to a post-event report with metrics and next steps.",
      },
    ],
  },

  "physical-goods": {
    title: "Merchandise Plan",
    description: "Design, production, fulfillment, and community impact",
    sections: [
      {
        title: "Product",
        placeholder:
          "Describe the item or set of items and how they represent Lil Nouns.",
      },
      {
        title: "Design & Brand",
        placeholder:
          "Explain the concept, visuals, and licensing for the artwork. Include mockups if possible.",
      },
      {
        title: "Production",
        placeholder:
          "Detail suppliers, materials, QA, and schedule from prototype to delivery.",
      },
      {
        title: "Distribution",
        placeholder:
          "Explain sales or giveaway channels, fulfillment plan, storage, and shipping.",
      },
      {
        title: "Costs & Pricing",
        placeholder:
          "List design, manufacturing, shipping, storage, fees, and pricing strategy.",
      },
      {
        title: "Community Impact",
        placeholder:
          "Describe benefits to the community and any revenue sharing or reinvestment.",
      },
    ],
  },

  "charity-donations": {
    title: "Charitable Initiative Plan",
    description: "Define cause, impact, transparency, and recognition",
    sections: [
      {
        title: "Cause",
        placeholder:
          "Identify the organization or initiative, its mission, and relevance to Lil Nouns values.",
      },
      {
        title: "Due Diligence",
        placeholder:
          "Provide status, governance, track record, and how funds are stewarded.",
      },
      {
        title: "Intended Impact",
        placeholder:
          "Explain how funds will be used and the outcomes you expect, with measurable indicators where possible.",
      },
      {
        title: "Community Fit",
        placeholder:
          "Describe how this work reflects community priorities or improves public perception.",
      },
      {
        title: "Transparency",
        placeholder:
          "Commit to reporting timelines, artifacts, and metrics to show results.",
      },
      {
        title: "Recognition",
        placeholder:
          "Explain how the contribution will be acknowledged and any co-promotional opportunities.",
      },
    ],
  },

  "marketing-media": {
    title: "Marketing Campaign Plan",
    description: "Define messaging, channels, budget, and KPIs",
    sections: [
      {
        title: "Objectives",
        placeholder:
          "What change do you want to produce such as awareness, participation, or conversions, and what core message supports it?",
      },
      {
        title: "Audience & Reach",
        placeholder:
          "Describe who you need to reach and where they are. Include platforms and communities.",
      },
      {
        title: "Creative",
        placeholder:
          "Outline the content approach such as visuals, tone, and narrative themes for Lil Nouns.",
      },
      {
        title: "Channels & Formats",
        placeholder:
          "List chosen platforms and content types such as posts, ads, newsletters, PR, or influencer work.",
      },
      {
        title: "Budget & Schedule",
        placeholder:
          "Provide spend by line item and the delivery calendar from kickoff to wrap.",
      },
      {
        title: "KPIs",
        placeholder:
          "Define how you will measure results such as reach, engagement, conversion, growth, or sentiment.",
      },
    ],
  },

  "defi-treasury": {
    title: "Treasury Strategy Plan",
    description: "Describe goals, platforms, risk controls, and reporting",
    sections: [
      {
        title: "Objectives",
        placeholder:
          "State the strategy goals and how they serve Lil Nouns treasury and mission.",
      },
      {
        title: "Platforms & Rationale",
        placeholder:
          "List protocols or platforms, why they fit, and any diligence performed.",
      },
      {
        title: "Risk",
        placeholder:
          "Identify technical and market risks like contract bugs, volatility, and liquidity. Explain mitigations.",
      },
      {
        title: "Returns",
        placeholder:
          "Give realistic performance expectations with assumptions or references.",
      },
      {
        title: "Monitoring & Access",
        placeholder:
          "Explain who operates positions, how they are tracked, and what controls are in place.",
      },
      {
        title: "Exit Criteria",
        placeholder:
          "Describe triggers for adjusting or closing positions and how results will be reported to the DAO.",
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
