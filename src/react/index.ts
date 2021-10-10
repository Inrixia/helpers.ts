export const toBase64 = async (file: File): Promise<string | ArrayBuffer> => {
	const base64Image = await new Promise<string | ArrayBuffer | null>((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
	}).catch((err) => err);
	if (base64Image instanceof Error) throw new Error(`Failed to convert file ${file.name} to base64.\n${base64Image.message}`);
	if (base64Image === undefined || base64Image === null) throw new Error(`Failed to convert file ${file.name} to base64.`);
	return base64Image;
};
