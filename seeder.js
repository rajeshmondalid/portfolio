require('dotenv').config();
const mongoose = require('mongoose');

const Profile = require('./models/Profile');
const Project = require('./models/Project');
const Skill = require('./models/Skill');
const Timeline = require('./models/Timeline');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portfolio_db';

const seedData = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log('MongoDB connected for seeding...');
    }

    // 1. Admin User
    const adminCount = await User.countDocuments();
    if (adminCount === 0) {
      const defaultUser = process.env.ADMIN_USER || 'admin';
      const defaultPass = process.env.ADMIN_PASS || 'admin123';
      await User.create({
        username: defaultUser,
        password: defaultPass,
        role: 'admin'
      });
      console.log(`✓ Admin user created: ${defaultUser}`);
    }

    // 2. Profile
    const profileCount = await Profile.countDocuments();
    if (profileCount === 0) {
      await Profile.create({
        name: 'Ratul Shee',
        eyebrow: "Hello World, I'm",
        roles: ['MERN Stack Developer', 'Full-Stack Architect', 'AI Integrations'],
        location: 'Chandannagar, West Bengal, India',
        statusText: 'Available for Full-Stack Roles & Freelance',
        tagline: 'Architecting robust web systems with MongoDB, Express.js, React, and Node.js. Turning complex business logic into lightning-fast, pixel-perfect user experiences.',
        bioStory: [
          'I am Ratul Shee, a MERN Stack Developer based in Chandannagar, West Bengal, India. I specialize in architecting responsive Single Page Applications in React backed by high-throughput RESTful services in Node.js & Express, powered by schema-optimized MongoDB databases.',
          'Beyond the core MERN stack, I am actively integrating Generative AI & LLM APIs into web products, building automated workflows, and pursuing my degree at Supreme Knowledge Foundation Group of Institutions.'
        ],
        avatarUrl: 'profile.jpg',
        resumeUrl: '#',
        socials: {
          github: 'https://github.com/Ratul-Shee/',
          linkedin: 'https://www.linkedin.com/in/ratul-shee/',
          twitter: 'https://x.com/RATUL_SHEE_666',
          facebook: 'https://www.facebook.com/ratul.shee.6/',
          email: 'ratulshee6@gmail.com'
        },
        metrics: {
          languages: 4,
          cleanCodePct: 100,
          gradYear: 2027,
          repos: 15
        },
        terminalWhoami: 'Full-Stack MERN Developer based in Chandannagar, India. Specializing in high-performance web systems and AI workflows.'
      });
      console.log('✓ Profile seeded.');
    }

    // 3. Projects
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      await Project.insertMany([
        {
          key: 'fintrack',
          title: 'FinTrack — Personal Expense Manager',
          category: 'mern',
          subtitle: 'Complete financial health tracker with secure JWT auth, category budgets, and spending analytics.',
          description: 'An intuitive finance manager enabling users to track expenditures, analyze category-wise spending patterns, manage budgets, and generate visual monthly health metrics.',
          highlights: [
            'Secure JWT Authentication & Sessions with bcrypt hashing',
            'Category Breakdown & Spending Charts with monthly summaries',
            'Monthly Summaries & Balance Analytics with Mongoose schemas'
          ],
          stack: ['React', 'Node.js', 'Express', 'MongoDB', 'Chart.js', 'REST API'],
          imageUrl: 'fintrack.jpg',
          liveUrl: 'https://github.com/Ratul-Shee/',
          repoUrl: 'https://github.com/Ratul-Shee/',
          isFeatured: true,
          order: 1
        },
        {
          key: 'devpulse',
          title: 'DevPulse — MERN Content Studio',
          category: 'mern',
          subtitle: 'Developer-focused publishing suite with live Markdown preview, author permissions, and SEO slugs.',
          description: 'A modern blog management platform featuring split-view Markdown authoring, tag indexing, role-based edit permissions, and SEO-friendly slug generation.',
          highlights: [
            'Split-Pane Markdown Editor & Live Preview with syntax highlights',
            'Author Permissions & Full CRUD Pipeline with RBAC guards',
            'Fast MongoDB Indexing & Query Caching for instantaneous search'
          ],
          stack: ['React', 'Node.js', 'Express', 'MongoDB', 'Markdown', 'REST API'],
          imageUrl: 'devpulse.jpg',
          liveUrl: 'https://github.com/Ratul-Shee/',
          repoUrl: 'https://github.com/Ratul-Shee/',
          isFeatured: true,
          order: 2
        },
        {
          key: 'promptmatrix',
          title: 'PromptMatrix — LLM Prompt Studio',
          category: 'ai',
          subtitle: 'Prompt engineering suite for testing, versioning, and benchmarking LLM system prompts.',
          description: 'An intelligent developer workbench for designing, testing, and versioning system prompts with real-time token cost calculators and API streaming endpoints.',
          highlights: [
            'Server-Sent Events (SSE) Streaming for real-time token delivery',
            'Prompt Versioning & Diff Comparison with cost benchmarking',
            'MongoDB Collections for Preset Libraries and prompt tags'
          ],
          stack: ['React', 'Node.js', 'OpenAI API', 'MongoDB', 'Tailwind', 'SSE'],
          imageUrl: 'fintrack.jpg',
          liveUrl: 'https://github.com/Ratul-Shee/',
          repoUrl: 'https://github.com/Ratul-Shee/',
          isFeatured: true,
          order: 3
        }
      ]);
      console.log('✓ Projects seeded.');
    }

    // 4. Skills
    const skillCount = await Skill.countDocuments();
    if (skillCount === 0) {
      await Skill.insertMany([
        // Languages
        { name: 'JavaScript (ES6+)', category: 'languages', proficiency: 92, order: 1 },
        { name: 'Python', category: 'languages', proficiency: 80, order: 2 },
        { name: 'Java', category: 'languages', proficiency: 75, order: 3 },
        { name: 'C', category: 'languages', proficiency: 70, order: 4 },
        // Frontend
        { name: 'React.js & Hooks', category: 'frontend', proficiency: 90, order: 1 },
        { name: 'HTML5 / Semantic Web', category: 'frontend', proficiency: 95, order: 2 },
        { name: 'CSS3 / Glassmorphism', category: 'frontend', proficiency: 90, order: 3 },
        { name: 'Responsive Design & UI', category: 'frontend', proficiency: 92, order: 4 },
        // Backend
        { name: 'Node.js Runtime', category: 'backend', proficiency: 88, order: 1 },
        { name: 'Express.js Framework', category: 'backend', proficiency: 88, order: 2 },
        { name: 'MongoDB & Mongoose', category: 'backend', proficiency: 85, order: 3 },
        { name: 'RESTful API Design', category: 'backend', proficiency: 90, order: 4 },
        // Tools
        { name: 'Git & GitHub Version Control', category: 'tools', proficiency: 90, order: 1 },
        { name: 'Applied AI & Prompt Dev', category: 'tools', proficiency: 82, order: 2 },
        { name: 'JWT & Web Security', category: 'tools', proficiency: 85, order: 3 },
        { name: 'Postman API Testing', category: 'tools', proficiency: 88, order: 4 }
      ]);
      console.log('✓ Skills seeded.');
    }

    // 5. Timeline
    const timelineCount = await Timeline.countDocuments();
    if (timelineCount === 0) {
      await Timeline.insertMany([
        {
          institution: 'Supreme Knowledge Foundation Group of Institutions',
          degree: 'Bachelor of Technology (B.Tech) Degree Program',
          dates: '2024 — 2027',
          badge: 'In Progress',
          description: 'Specializing in computer systems, algorithms, database architectures, and software engineering. Building full-stack web applications alongside rigorous coursework.',
          order: 1
        },
        {
          institution: 'Nawpara High School',
          degree: 'Higher Secondary Education (Science & Mathematics)',
          dates: 'Higher Secondary',
          badge: 'Completed',
          description: 'Developed analytical thinking, mathematical foundations, and early programming fundamentals.',
          order: 2
        },
        {
          institution: 'Kanailal Vidyamandir (F.S)',
          degree: 'Secondary Schooling',
          dates: 'Class 5 — 10',
          badge: 'Completed',
          description: 'Built core foundation in sciences, language, logic, and early computer literacy.',
          order: 3
        }
      ]);
      console.log('✓ Timeline seeded.');
    }

    console.log('🎉 Seeding successfully completed!');
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

if (require.main === module) {
  seedData().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}

module.exports = seedData;
