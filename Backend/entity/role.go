package entity

type Role string

const (
	RoleSuperAdmin Role = "super_admin"
	RoleAdmin      Role = "admin"
	RoleStaff      Role = "staff"
	RoleFieldStaff Role = "field_staff"
	RoleHousehold  Role = "household"
)
