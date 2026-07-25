import { createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit';
import {
  extractText,
  extractPdf,
  commitComplaint,
  fetchComplaintHistory,
} from '../api/complaintApi';

const EMPTY_FORM = {
  complaint_id: null,
  complaint_source: null,
  customer_name: null,
  product_name: null,
  product_strength: null,
  batch_number: null,
  affected_quantity: null,
  manufacturing_date: null,
  expiry_date: null,
  originating_site_block: null,
  impacted_npm: null,
  complaint_category: null,
  complaint_description: null,
  complaint_summary: null,
  severity_suggested: null,
  suggested_next_action: null,
  initial_risk_assessment: null,
  root_cause_recommendation: null,
  capa_recommendation: null,
  duplicate_complaint_ids: null,
  status: 'Pending Triage',
};

const initialState = {
  sessionId: nanoid(),
  form: EMPTY_FORM,
  messages: [
    {
      id: nanoid(),
      role: 'assistant',
      content:
        "Ready to process new complaints. You can paste the raw email from the customer, or upload a PDF of the complaint report. I will extract the data and run the initial risk assessment.",
    },
  ],
  updatedFields: [],
  completeness: 0,
  missingRequiredFields: [],
  history: [],
  isProcessing: false,
  isCommitting: false,
  isHistoryOpen: false,
  isLoadingHistory: false,
  error: null,
  historyError: null,
};

export const sendMessage = createAsyncThunk(
  'complaint/sendMessage',
  async (message, { getState }) => {
    const { sessionId, form } = getState().complaint;
    return extractText(sessionId, message, form);
  }
);

export const uploadPdf = createAsyncThunk(
  'complaint/uploadPdf',
  async (file, { getState }) => {
    const { sessionId } = getState().complaint;
    return extractPdf(sessionId, file);
  }
);

export const commit = createAsyncThunk(
  'complaint/commit',
  async (_, { getState }) => {
    const { form } = getState().complaint;
    return commitComplaint(form);
  }
);

export const loadComplaintHistory = createAsyncThunk(
  'complaint/loadComplaintHistory',
  async () => fetchComplaintHistory()
);

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    resetSession(state) {
      Object.assign(state, {
        ...initialState,
        sessionId: nanoid(),
        messages: initialState.messages,
      });
    },
    updateField(state, action) {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    toggleHistory(state) {
      state.isHistoryOpen = !state.isHistoryOpen;
    },
    closeHistory(state) {
      state.isHistoryOpen = false;
    },
    loadHistoricalComplaint(state, action) {
      state.form = stripHistoryDates(action.payload);
      state.updatedFields = [];
      state.completeness = 0;
      state.missingRequiredFields = [];
      state.messages.push({
        id: nanoid(),
        role: 'assistant',
        content: `Loaded ${action.payload.complaint_id} from past complaints.`,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state, action) => {
        state.isProcessing = true;
        state.error = null;
        state.messages.push({
          id: nanoid(),
          role: 'user',
          content: action.meta.arg,
        });
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isProcessing = false;
        applyCopilotResponse(state, action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.error.message;
        state.messages.push({
          id: nanoid(),
          role: 'assistant',
          content:
            "I couldn't reach the extraction service. Check that the backend is running and try again.",
          isError: true,
        });
      })

      .addCase(uploadPdf.pending, (state, action) => {
        state.isProcessing = true;
        state.error = null;
        state.messages.push({
          id: nanoid(),
          role: 'user',
          content: action.meta.arg.name,
          isFile: true,
        });
      })
      .addCase(uploadPdf.fulfilled, (state, action) => {
        state.isProcessing = false;
        applyCopilotResponse(state, action.payload);
      })
      .addCase(uploadPdf.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.error.message;
        state.messages.push({
          id: nanoid(),
          role: 'assistant',
          content: "I couldn't parse that PDF. Try a different file, or paste the complaint text instead.",
          isError: true,
        });
      })

      .addCase(commit.pending, (state) => {
        state.isCommitting = true;
        state.error = null;
      })
      .addCase(commit.fulfilled, (state, action) => {
        state.isCommitting = false;
        state.form.status = action.payload.form.status;
      })
      .addCase(commit.rejected, (state, action) => {
        state.isCommitting = false;
        state.error = action.error.message;
      })

      .addCase(loadComplaintHistory.pending, (state) => {
        state.isLoadingHistory = true;
        state.historyError = null;
      })
      .addCase(loadComplaintHistory.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.history = action.payload;
      })
      .addCase(loadComplaintHistory.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.historyError = action.error.message;
      });
  },
});

function applyCopilotResponse(state, payload) {
  state.form = payload.form;
  state.updatedFields = payload.updated_fields;
  state.completeness = payload.completeness;
  state.missingRequiredFields = payload.missing_required_fields;
  state.messages.push({
    id: nanoid(),
    role: 'assistant',
    content: payload.assistant_message,
  });
}

function stripHistoryDates(complaint) {
  const { created_at, updated_at, ...form } = complaint;
  void created_at;
  void updated_at;
  return form;
}

export const {
  resetSession,
  updateField,
  toggleHistory,
  closeHistory,
  loadHistoricalComplaint,
} = complaintSlice.actions;
export default complaintSlice.reducer;
