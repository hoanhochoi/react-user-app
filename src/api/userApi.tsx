import axiosClient from "./axiosClient";

const userApi = { 
  getAll: (email?: string, config?: any) => axiosClient.get('/users',{
    params: {email},
    ...config
  }),
  create: (data:any) => axiosClient.post('/users', data),
  update: (id:number, data:any) => axiosClient.put(`/users/${id}`, data),
  updateStatus: (id:number,status:boolean) => axiosClient.patch(`/users/${id}`,{isActive : status}),
  delete: (id:number) => axiosClient.delete(`/users/${id}`),
  getProfile: ()=>axiosClient.get('auth/profile'),
  
};

export default userApi;

