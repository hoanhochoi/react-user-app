import axiosClient from "./axiosClient";

interface loginPayload{
  username: string,
  password: string
}

const authApi = {
  login: (data: loginPayload) => axiosClient.post('/auth/login', data), // Khớp với endpoint NestJS của bạn
};

export default authApi;