import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

// Store current driver instance globally for close button
let currentDriver: ReturnType<typeof driver> | null = null;

// Custom styling for the tour
const tourConfig = {
  showProgress: true,
  progressText: '{{current}} of {{total}}',
  nextBtnText: 'Next →',
  prevBtnText: '← Back',
  doneBtnText: 'Done ✓',
  popoverClass: 'driverjs-theme-custom',
  onCloseClick: () => {
    // Mark tour as completed when user closes
    localStorage.setItem('productTourCompleted', 'true');
    if (currentDriver) {
      currentDriver.destroy();
      currentDriver = null;
    }
  },
  onDestroyStarted: () => {
    // Mark tour as completed when user completes tour
    localStorage.setItem('productTourCompleted', 'true');
  },
};

// Dashboard Overview Tour
export const startDashboardTour = () => {
  const driverObj = driver({
    ...tourConfig,
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Welcome to Amped Agent! 👋',
          description: `
            <div style="margin-bottom: 16px;">
              <p style="margin-bottom: 12px; color: #6b7280;">Here's a quick look at what you can do with Amped Agent:</p>
              <ul style="list-style: none; padding: 0; margin: 0 0 16px 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 8px;"><span style="color: #f97316;">🎬</span> <strong>AI Reels</strong> — Vertical videos for Instagram, TikTok & YouTube Shorts</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 8px;"><span style="color: #f97316;">🏡</span> <strong>Property Tour</strong> — Cinematic listing videos in minutes</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 8px;"><span style="color: #f97316;">🎭</span> <strong>Avatar Videos</strong> — Your face, your voice, fully AI-generated</li>
                <li style="padding: 8px 0; display: flex; align-items: center; gap: 8px;"><span style="color: #f97316;">📱</span> <strong>Live Tour</strong> — Record a walkthrough on your phone, auto-edited</li>
              </ul>
              <p style="color: #6b7280;">Click <strong>Next</strong> to take a quick tour of the platform!</p>
            </div>
          `
        }
      },
      {
        element: '[href="/persona-brand"]',
        popover: {
          title: 'Step 1: Set Up Your Brand',
          description: 'Start here! Add your headshot, brand colors, target audience, and unique selling points. This helps AI generate content that sounds like YOU.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[href="/generate-post"]',
        popover: {
          title: 'Step 2: Generate Posts',
          description: 'Create AI-powered social media content in seconds. Choose from templates, customize your message, and generate professional posts.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[href="/autoreels"]',
        popover: {
          title: 'Step 3: Create Video Reels',
          description: 'Create scroll-stopping vertical videos with AI avatars and faceless reels. Perfect for Instagram Reels, TikTok, and YouTube Shorts.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[href="/content-calendar"]',
        popover: {
          title: 'Step 4: Schedule Content',
          description: 'View and manage all your scheduled posts in one place. Schedule up to 60 days of content in advance.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: 'body',
        popover: {
          title: 'Ready to Get Started! 🚀',
          description: 'You\'re all set! Start with "Persona & Brand" to set up your profile, then create your first post. You can replay this tour anytime by clicking "Start Tour".'
        }
      }
    ]
  });

  currentDriver = driverObj;
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

  currentDriver = driverObj;
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

  currentDriver = driverObj;
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

  currentDriver = driverObj;
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
