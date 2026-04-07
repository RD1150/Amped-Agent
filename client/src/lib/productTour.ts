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
          title: 'Welcome to AmpedAgent! 👋',
          description: `
            <div style="margin-bottom: 16px;">
              <p style="margin-bottom: 12px;">Watch this quick 60-second intro to see what you can accomplish with AmpedAgent:</p>
              <video 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/TdPsCdKazBtIqarA.mp4" 
                controls 
                width="100%" 
                height="315" 
                style="border-radius: 8px; margin-bottom: 12px;"
              ></video>
              <p>After watching, click <strong>Next</strong> to start the interactive tour!</p>
              <div style="margin-top: 16px; text-align: center;">
                <button 
                  id="skip-video-btn" 
                  style="
                    padding: 8px 16px;
                    background: transparent;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                  "
                  onmouseover="this.style.borderColor='#9ca3af'; this.style.color='#374151'"
                  onmouseout="this.style.borderColor='#d1d5db'; this.style.color='#6b7280'"
                >
                  Skip Video →
                </button>
              </div>
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
  
  // Add click handler for Skip Video button after tour starts
  setTimeout(() => {
    const skipBtn = document.getElementById('skip-video-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        driverObj.moveNext();
      });
    }
  }, 100);
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
