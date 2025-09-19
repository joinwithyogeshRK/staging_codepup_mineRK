import * as amplitude from "@amplitude/analytics-browser";
import { sessionReplayPlugin } from "@amplitude/plugin-session-replay-browser";
// import { plugin as engagementPlugin } from "@amplitude/engagement-browser";

amplitude.add(sessionReplayPlugin());
// amplitude.add(engagementPlugin());
amplitude.init("367cde3fdffdda095fd5224e90020801", {
  autocapture: {
    attribution: true,
    fileDownloads: true,
    formInteractions: true,
    pageViews: true,
    sessions: true,
    elementInteractions: true,
    networkTracking: true,
    webVitals: true,
    frustrationInteractions: true,
  },
});

export { amplitude };