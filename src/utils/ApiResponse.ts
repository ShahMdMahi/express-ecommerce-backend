export class ApiResponse {
    readonly statusCode: number;
    readonly data: any;
    readonly message: string;
    readonly success: boolean;

    constructor(statusCode: number, data: any, message: string = 'Success') {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }

    static success(data: any, message: string = 'Success') {
        return new ApiResponse(200, data, message);
    }

    static created(data: any, message: string = 'Created successfully') {
        return new ApiResponse(201, data, message);
    }

    static noContent(message: string = 'No content') {
        return new ApiResponse(204, null, message);
    }

    toJSON() {
        return {
            success: this.success,
            message: this.message,
            data: this.data
        };
    }
}
