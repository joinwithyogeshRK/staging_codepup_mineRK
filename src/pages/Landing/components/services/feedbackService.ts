import axios from "axios";
import { extractColorsFromDesignChoices } from "../../Index"; // adjust import as needed

const BASE_URL = import.meta.env.VITE_BASE_URL;

const handleFeedbackSubmit = async (
  feedback: string,
  currentProjectId: number | null,
  dbUser: any,
  projects: any[],
  getToken: () => Promise<string | null>,
  setWorkflowMessages: React.Dispatch<React.SetStateAction<any[]>>,
  setCurrentStep: React.Dispatch<React.SetStateAction<string>>,
  setDesignChoices: React.Dispatch<React.SetStateAction<any>>,
  setReadyToGenerate: React.Dispatch<React.SetStateAction<boolean>>,
  setIsProcessingFeedback: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!currentProjectId || !dbUser) return;

  setIsProcessingFeedback(true);

  const userMessage = {
    id: `user-${Date.now()}`,
    content: feedback,
    type: "user",
    timestamp: new Date(),
  };

  setWorkflowMessages((prev) => [...prev, userMessage]);

  try {
    const token = await getToken();
    const currentProject = projects.find((p) => p.id === currentProjectId);

    const feedbackResponse = await axios.post(
      `${BASE_URL}/api/design/feedback`,
      {
        feedback,
        userId: dbUser.id.toString(),
        projectId: currentProjectId,
        projectName: currentProject?.name,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (feedbackResponse.data.success) {
      let processedDesignChoices = feedbackResponse.data.designChoices;

      if (processedDesignChoices && !processedDesignChoices.colorScheme) {
        const extractedColors = extractColorsFromDesignChoices(
          processedDesignChoices
        );
        processedDesignChoices.colorScheme = extractedColors;
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        content: feedbackResponse.data.message,
        type: "assistant",
        timestamp: new Date(),
        step: feedbackResponse.data.step,
        designChoices: processedDesignChoices,
      };

      setWorkflowMessages((prev) => [...prev, assistantMessage]);
      setCurrentStep(feedbackResponse.data.step);
      setDesignChoices(processedDesignChoices);
      setReadyToGenerate(feedbackResponse.data.readyToGenerate || false);
    }
  } catch (error) {
    const errorMessage = {
      id: `error-${Date.now()}`,
      content:
        "Arf! 🐾Something went wrong fetching your feedback. Give it another go!",
      type: "assistant",
      timestamp: new Date(),
    };
    setWorkflowMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsProcessingFeedback(false);
  }
};


export default handleFeedbackSubmit