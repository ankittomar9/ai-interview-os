import type { VerificationReceipt } from './api';

let screenStream: MediaStream | null = null;
let verifyReceipt: VerificationReceipt | null = null;

export const setScreenStream = (stream: MediaStream | null): void => {
  if (screenStream && screenStream !== stream) {
    screenStream.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch (_) {}
    });
  }
  screenStream = stream;
};

export const getScreenStream = (): MediaStream | null => {
  return screenStream;
};

export const setVerifyReceipt = (receipt: VerificationReceipt | null): void => {
  verifyReceipt = receipt;
};

export const getVerifyReceipt = (): VerificationReceipt | null => {
  return verifyReceipt;
};

export const clearVerificationStreams = (): void => {
  if (screenStream) {
    screenStream.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch (_) {}
    });
    screenStream = null;
  }
  verifyReceipt = null;
};
