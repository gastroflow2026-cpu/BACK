import {v2} from 'cloudinary';
import { environment } from './enviroment';

export const CloudinaryConfig = {
    provide: 'CLOUDINARY',
    useFactory: () => {
        return v2.config({
            cloud_name: environment.CLOUDINARY_CLOUD_NAME,
            api_key: environment.CLOUDINARY_API_KEY,
            api_secret: environment.CLOUDINARY_API_SECRET
        })
    }
}