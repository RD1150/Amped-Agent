import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// Custom styling for the tour
const tourConfig = {
  showProgress: true,
  progressText: '{{current}} of {{total}}',
  nextBtnText: 'Next →',
  prevBtnText: '← Back',
  doneBtnText: 'Done ✓',
  popoverClass: 'driverjs-theme-custom',
  onDestroyStarted: () => {
    // Mark tour as completed
    localStorage.setItem('productTourCompleted', 'true');
  },
} as const;

// Dashboard Overview Tour
export const startDashboardTour = () => {
  const driverObj = driver({
    ...tourConfig,
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Welcome to Authority Content! 👋',
          description: 'Let\'s take a quick tour of the platform. This will only take 60 seconds.'
        }
      },
      {
        element: '[href="/generate-post"]',
        popover: {
          title: 'Generate Post',
          description: 'Create AI-powered social media content in seconds. Choose from templates, customize your message, and generate professional posts.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[href="/autoreels"]',
        popover: {
          title: 'AutoReels - AI Video Generation',
          description: 'Create scroll-stopping vertical videos with AI avatars and faceless reels. Perfect for Instagram Reels, TikTok, and YouTube Shorts.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[href="/content-calendar"]',
        popover: {
          title: 'Content Calendar',
          description: 'View and manage all your scheduled posts in one place. Schedule up to 60 days of content in advance.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[href="/persona-brand"]',
        popover: {
          title: 'Persona & Brand',
          description: 'Set up your brand voice, target audience, and unique selling points. This helps AI generate content that sounds like you.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: 'body',
        popover: {
          title: 'Ready to Get Started! 🚀',
          description: 'You\'re all set! Click "Generate Post" to create your first piece of content. You can replay this tour anytime from the Help menu.'
        }
      }
    ]
  });

  driverObj.drive();
};

// Generate Post Feature Tour
export const startGeneratePostTour = () => {
  const driverObj = driver({
    ...tourConfig,
    steps: [
      {
        element: 'select[name="category"]',
        popover: {
          title: 'Step 1: Choose a Category',
          description: 'Select the type of content you want to create. Each category has specialized templates designed for real estate.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'select[name="template"]',
        popover: {
          title: 'Step 2: Pick a Template',
          description: 'Choose a template that matches your goal. Templates include proven copywriting frameworks and hooks.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'textarea[name="topic"]',
        popover: {
          title: 'Step 3: Describe Your Topic',
          description: 'Tell us what you want to post about. Be specific! Example: "Tips for first-time homebuyers in Austin"',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: 'button[type="submit"]',
        popover: {
          title: 'Step 4: Generate!',
          description: 'Click to generate your post. The AI will create professional content based on your inputs. You can edit and regenerate as needed.',
          side: 'top',
          align: 'start'
        }
      }
    ]
  });

  driverObj.drive();
};

// AutoReels Feature Tour
export const startAutoReelsTour = () => {
  const driverObj = driver({
    ...tourConfig,
    steps: [
      {
        element: '.avatar-upload-section',
        popover: {
          title: 'Upload Your Avatar (Optional)',
          description: 'Upload a professional headshot to create AI avatar intro videos. Your avatar will introduce your reels with a personalized message.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'select[name="topic"]',
        popover: {
          title: 'Choose Your Video Topic',
          description: 'Select what you want your reel to be about. Each topic comes with proven hooks and scripts.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'select[name="hook"]',
        popover: {
          title: 'Pick an Attention-Grabbing Hook',
          description: 'Choose the opening line for your video. Hooks are designed to stop scrollers and get them to watch.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: 'button[type="submit"]',
        popover: {
          title: 'Generate Your Reel!',
          description: 'Click to create your video. The AI will generate a script, render the video with captions, and deliver it in 30-60 seconds.',
          side: 'top',
          align: 'start'
        }
      }
    ]
  });

  driverObj.drive();
};

// Content Calendar Feature Tour
export const startContentCalendarTour = () => {
  const driverObj = driver({
    ...tourConfig,
    steps: [
      {
        element: '.calendar-view',
        popover: {
          title: 'Your Content Calendar',
          description: 'See all your scheduled posts at a glance. Click any date to see posts scheduled for that day.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.schedule-button',
        popover: {
          title: 'Schedule Posts',
          description: 'Click here to schedule your generated content. You can schedule up to 60 days in advance.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '.filter-options',
        popover: {
          title: 'Filter & Organize',
          description: 'Filter posts by platform, status, or date range to stay organized.',
          side: 'bottom',
          align: 'start'
        }
      }
    ]
  });

  driverObj.drive();
};

// Check if user should see the tour
export const shouldShowTour = (): boolean => {
  return !localStorage.getItem('productTourCompleted');
};

// Reset tour (for testing or user request)
export const resetTour = () => {
  localStorage.removeItem('productTourCompleted');
};
