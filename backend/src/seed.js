
require("dotenv").config();
const pool = require("./db");

// These are real opportunity-discovery portals, not verified individual vacancies.
// Keep them UNVERIFIED until the specific opportunity has been checked.

const sampleOpportunities = [
  // JOBS
  {
    title: "Zambia Government Jobs Portal",
    organisation: "Government of Zambia",
    description: "Browse government vacancies and recruitment announcements.",
    category: "JOB",
    url: "https://jobs.grz.gov.zm/"
  },
  {
    title: "Imisepela Jobs and Opportunities",
    organisation: "Imisepela",
    description: "Explore jobs, internships, scholarships and funding opportunities in Zambia.",
    category: "JOB",
    url: "https://www.imisepela.com/"
  },
  {
    title: "Zambia Youth Opportunities",
    organisation: "Ministry of Youth, Sport and Arts",
    description: "Explore opportunities for young people in Zambia, including employment and empowerment programmes.",
    category: "JOB",
    url: "https://www.mysayouthportal.gov.zm/"
  },
  {
    title: "United Nations Careers",
    organisation: "United Nations",
    description: "Search international vacancies and professional opportunities.",
    category: "JOB",
    url: "https://careers.un.org/"
  },
  {
    title: "African Development Bank Careers",
    organisation: "African Development Bank",
    description: "Explore employment opportunities at the African Development Bank.",
    category: "JOB",
    url: "https://www.afdb.org/en/about-us/careers"
  },
  {
    title: "African Union Careers",
    organisation: "African Union",
    description: "Browse career opportunities with the African Union.",
    category: "JOB",
    url: "https://careers.au.int/"
  },

  // INTERNSHIPS
  {
    title: "ZAMREN Internship Programme",
    organisation: "Zambia Research and Education Network",
    description: "Explore ICT, research and technology internship opportunities for students and graduates.",
    category: "INTERNSHIP",
    url: "https://zamren.zm/internships/"
  },
  {
    title: "UN Talent Jobs and Internships",
    organisation: "UN Talent",
    description: "Explore international jobs, internships and other opportunities.",
    category: "INTERNSHIP",
    url: "https://untalent.org/jobs/search"
  },
  {
    title: "UNDP Careers",
    organisation: "United Nations Development Programme",
    description: "Search career and internship-related opportunities with UNDP.",
    category: "INTERNSHIP",
    url: "https://www.undp.org/careers"
  },

  // SCHOLARSHIPS
  {
    title: "Chevening Scholarships",
    organisation: "Chevening",
    description: "Explore UK scholarship and fellowship opportunities and check eligibility for Zambia.",
    category: "SCHOLARSHIP",
    url: "https://www.chevening.org/apply/"
  },
  {
    title: "DAAD Scholarship Database",
    organisation: "DAAD",
    description: "Search scholarships and study funding opportunities. Check country and programme eligibility.",
    category: "SCHOLARSHIP",
    url: "https://www.daad.org/en/find-funding/scholarship-database/"
  },
  {
    title: "Mastercard Foundation Scholars Programme",
    organisation: "Mastercard Foundation",
    description: "Find participating institutions and scholarship application information.",
    category: "SCHOLARSHIP",
    url: "https://mastercardfdn.org/en/what-we-do/our-programs/mastercard-foundation-scholars-program/where-to-apply/"
  },
  {
    title: "EduCanada Scholarships",
    organisation: "Government of Canada",
    description: "Explore scholarship opportunities and funding information for international students.",
    category: "SCHOLARSHIP",
    url: "https://www.educanada.ca/scholarships-bourses/index.aspx?lang=eng"
  },

  // TRAINING AND DIGITAL SKILLS
  {
    title: "Cisco Skills for All",
    organisation: "Cisco",
    description: "Explore digital skills courses in networking, cybersecurity and related technology fields.",
    category: "TRAINING",
    url: "https://skillsforall.com/"
  },
  {
    title: "Coursera Online Courses",
    organisation: "Coursera",
    description: "Explore online courses, professional certificates and learning programmes. Fees may apply.",
    category: "TRAINING",
    url: "https://www.coursera.org/"
  },
  {
    title: "Acumen Academy",
    organisation: "Acumen",
    description: "Explore learning programmes and training for social-impact leaders and entrepreneurs.",
    category: "TRAINING",
    url: "https://acumenacademy.org/"
  },

  // VOLUNTEERING
  {
    title: "United Nations Volunteers",
    organisation: "United Nations Volunteers",
    description: "Explore volunteer assignments and online volunteering opportunities.",
    category: "VOLUNTEERING",
    url: "https://www.unv.org/"
  },
  {
    title: "Idealist Volunteer Opportunities",
    organisation: "Idealist",
    description: "Search volunteer opportunities with nonprofits and community organisations.",
    category: "VOLUNTEERING",
    url: "https://www.idealist.org/"
  },

  // GRANTS AND FUNDING
  {
    title: "Africa No Filter Opportunity Hub",
    organisation: "Africa No Filter",
    description: "Discover African opportunities across grants, jobs, scholarships, fellowships and training.",
    category: "GRANT",
    url: "https://opportunity.africanofilter.org/"
  },
  {
    title: "Open Opportunities",
    organisation: "Open Opportunities",
    description: "Explore opportunities including grants, scholarships, internships and fellowships. Check eligibility and deadlines.",
    category: "GRANT",
    url: "https://openopportunities.org/opportunities/"
  },

  // ENTREPRENEURSHIP
  {
    title: "Zambia Youth Entrepreneurship Opportunities",
    organisation: "Ministry of Youth, Sport and Arts",
    description: "Explore youth entrepreneurship resources, empowerment and funding information.",
    category: "ENTREPRENEURSHIP",
    url: "https://www.mysayouthportal.gov.zm/"
  },
  {
    title: "Imisepela Funding Opportunities",
    organisation: "Imisepela",
    description: "Explore funding and business support opportunities and verify each programme's requirements.",
    category: "ENTREPRENEURSHIP",
    url: "https://www.imisepela.com/"
  },

  // FELLOWSHIPS
  {
    title: "Chevening Fellowships",
    organisation: "Chevening",
    description: "Explore fellowship programmes and check eligibility and application dates.",
    category: "FELLOWSHIP",
    url: "https://www.chevening.org/apply/"
  },
  {
    title: "Acumen Fellowship and Learning Programmes",
    organisation: "Acumen",
    description: "Explore programmes for people working on social impact and community development.",
    category: "FELLOWSHIP",
    url: "https://acumenacademy.org/"
  },

  // COMPETITIONS
  {
    title: "Devpost Hackathons",
    organisation: "Devpost",
    description: "Explore hackathons and technology competitions where participants build and present projects.",
    category: "COMPETITION",
    url: "https://devpost.com/"
  },
  {
    title: "Africa No Filter Opportunities and Calls",
    organisation: "Africa No Filter",
    description: "Explore African grants, calls and opportunities that may include creative projects and competitions.",
    category: "COMPETITION",
    url: "https://opportunity.africanofilter.org/"
  }
];

(async () => {
  try {
    let inserted = 0;

    for (const item of sampleOpportunities) {
      const [result] = await pool.query(
        `INSERT INTO opportunities
        (
          title,
          organisation,
          description,
          category,
          application_url,
          deadline,
          source_url,
          verification_status
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1
          FROM opportunities
          WHERE title = ? AND organisation = ?
        )`,
        [
          item.title,
          item.organisation,
          item.description,
          item.category,
          item.url,
          null,
          item.url,
          "UNVERIFIED",
          item.title,
          item.organisation
        ]
      );

      inserted += result.affectedRows;
    }

    console.log(`Seed complete. ${inserted} new listings added.`);
    console.log(`${sampleOpportunities.length} portal listings were processed.`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
