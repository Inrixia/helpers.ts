export const statusOK = (status: number): boolean => status !== undefined && status >= 200 && status < 300;
export const rejectNotOk = (res: Response): Response => {
	if (statusOK(res.status)) return res;
	throw new Error(`${res.status} ${res.statusText}`, { cause: res.url });
};

export const toJson = <T>(res: { json: () => any }): Promise<T> => res.json();
export const toText = (res: { text: () => Promise<string> }): Promise<string> => res.text();
export const toBlob = (res: { blob: () => Promise<Blob> }): Promise<Blob> => res.blob();
export const toArrayBuffer = (res: { arrayBuffer: () => Promise<ArrayBuffer> }): Promise<ArrayBuffer> => res.arrayBuffer();
export const toBytes = (res: { bytes: () => Promise<Uint8Array> }): Promise<Uint8Array> => res.bytes();
export const toFormData = (res: { formData: () => Promise<FormData> }): Promise<FormData> => res.formData();
