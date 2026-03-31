"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const validation_message_pipe_1 = require("../pipes/validation-message.pipe");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let statusCode;
        let message;
        let error;
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const responseObj = exceptionResponse;
                message =
                    responseObj.message || exception.message;
                error = responseObj.error || this.getErrorName(statusCode);
            }
            else {
                message = exception.message;
                error = this.getErrorName(statusCode);
            }
        }
        else if (exception instanceof Error) {
            statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = 'Internal Server Error';
            this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
        }
        else {
            statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = 'Internal Server Error';
            this.logger.error('Unknown exception type', String(exception));
        }
        const errorResponse = {
            success: false,
            statusCode,
            error: this.translateErrorName(error),
            message: (0, validation_message_pipe_1.translateValidationMessages)(message),
            path: request.url,
            timestamp: new Date().toISOString(),
        };
        response.status(statusCode).json(errorResponse);
    }
    getErrorName(statusCode) {
        const errorNames = {
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            409: 'Conflict',
            422: 'Unprocessable Entity',
            429: 'Too Many Requests',
            500: 'Internal Server Error',
        };
        return errorNames[statusCode] || 'Error';
    }
    translateErrorName(error) {
        const translations = {
            'Bad Request': 'Ошибка в данных',
            'Unauthorized': 'Требуется авторизация',
            'Forbidden': 'Доступ запрещён',
            'Not Found': 'Не найдено',
            'Conflict': 'Конфликт данных',
            'Unprocessable Entity': 'Некорректные данные',
            'Too Many Requests': 'Слишком много запросов',
            'Internal Server Error': 'Внутренняя ошибка сервера',
        };
        return translations[error] || error;
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map