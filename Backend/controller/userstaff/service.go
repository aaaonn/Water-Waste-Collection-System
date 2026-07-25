package userstaff

import (
	"errors"
	"backend/entity"
	"golang.org/x/crypto/bcrypt"
)

type UserstaffService interface {
	GetAll() ([]UserstaffResponse, error)
	GetByID(id uint) (*UserstaffResponse, error)
	Create(req *CreateUserstaffRequest, requesterRole string) (*UserstaffResponse, error)
	Update(id uint, req *UpdateUserstaffRequest, requesterRole string) (*UserstaffResponse, error)
	Delete(id uint, requesterRole string) error
}

type userstaffService struct {
	repo UserstaffRepository
}

func NewUserstaffService(repo UserstaffRepository) UserstaffService {
	return &userstaffService{repo: repo}
}

func (s *userstaffService) GetAll() ([]UserstaffResponse, error) {
	staffs, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	var responses []UserstaffResponse
	for _, staff := range staffs {
		if staff.User != nil {
			responses = append(responses, ToUserstaffResponse(staff.User, &staff))
		}
	}
	return responses, nil
}

func (s *userstaffService) GetByID(id uint) (*UserstaffResponse, error) {
	staff, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if staff.User == nil {
		return nil, errors.New("login details not found for this staff")
	}

	res := ToUserstaffResponse(staff.User, staff)
	return &res, nil
}

func (s *userstaffService) Create(req *CreateUserstaffRequest, requesterRole string) (*UserstaffResponse, error) {
	// ตรวจสอบ Role ของผู้สร้าง
	if req.Role == entity.RoleHousehold {
		return nil, errors.New("cannot create household role through this API")
	}

	if requesterRole == string(entity.RoleAdmin) && req.Role == entity.RoleSuperAdmin {
		return nil, errors.New("admin cannot create superadmin role")
	}

	// ดึง Subdistrict เริ่มต้น (เนื่องจากมีตำบลเดียว)
	subdistrict, err := s.repo.GetFirstSubdistrict()
	if err != nil {
		return nil, errors.New("failed to find default subdistrict")
	}

	// Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	status := entity.StatusActive
	if req.Status != nil {
		status = *req.Status
	}

	// สร้าง Object Login
	login := &entity.Login{
		SubdistrictID: subdistrict.ID,
		Username:      req.Username,
		PasswordHash:  string(hashedPassword),
		Role:          req.Role,
		Status:        status, // ตั้งค่า status ตามที่ส่งมา หรือ default เป็น Active
	}

	// สร้าง Object Staff
	staff := &entity.Staff{
		TitleName:   req.TitleName,
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		PhoneNumber: req.PhoneNumber,
	}

	// บันทึกลงฐานข้อมูล
	if err := s.repo.Create(login, staff); err != nil {
		return nil, err
	}

	// ผูกข้อมูลส่งกลับ
	staff.User = login
	res := ToUserstaffResponse(login, staff)
	return &res, nil
}

func (s *userstaffService) Update(id uint, req *UpdateUserstaffRequest, requesterRole string) (*UserstaffResponse, error) {
	staff, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}
	if staff.User == nil {
		return nil, errors.New("login details not found for this staff")
	}

	// ตรวจสอบเงื่อนไข Role หากมีการส่งค่า Role มาเปลี่ยน
	if req.Role != nil {
		if *req.Role == entity.RoleHousehold {
			return nil, errors.New("cannot update role to household through this API")
		}
		if requesterRole == string(entity.RoleAdmin) && *req.Role == entity.RoleSuperAdmin {
			return nil, errors.New("admin cannot update role to superadmin")
		}
	}

	// อัปเดตข้อมูล Staff ถ้ามีการส่งมา
	if req.TitleName != nil {
		staff.TitleName = *req.TitleName
	}
	if req.FirstName != nil {
		staff.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		staff.LastName = *req.LastName
	}
	if req.PhoneNumber != nil {
		staff.PhoneNumber = *req.PhoneNumber
	}

	// อัปเดตข้อมูล Login ถ้ามีการส่งมา
	if req.Role != nil {
		staff.User.Role = *req.Role
	}
	if req.Status != nil {
		staff.User.Status = *req.Status
	}
	if req.Password != nil && *req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}
		staff.User.PasswordHash = string(hashedPassword)
	}

	if err := s.repo.Update(staff.User, staff); err != nil {
		return nil, err
	}

	res := ToUserstaffResponse(staff.User, staff)
	return &res, nil
}

// Delete ทำการลบผู้ใช้งานแบบ Soft Delete ผ่าน GORM (อัปเดต deleted_at) และตรวจสอบสิทธิ์
func (s *userstaffService) Delete(id uint, requesterRole string) error {
	staff, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("user not found")
	}
	if staff.User == nil {
		return errors.New("login details not found for this staff")
	}

	// เช็คสิทธิ์: admin ไม่สามารถลบ super_admin ได้
	if requesterRole == string(entity.RoleAdmin) && staff.User.Role == entity.RoleSuperAdmin {
		return errors.New("admin cannot delete superadmin")
	}

	return s.repo.Delete(staff)
}
