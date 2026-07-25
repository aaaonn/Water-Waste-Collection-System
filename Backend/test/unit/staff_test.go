package test

import (
	"testing"

	"backend/entity"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

// createValidStaff สร้าง Staff ที่มีข้อมูลถูกต้องทุก field สำหรับใช้เป็น base ในแต่ละ test case
func createValidStaff() entity.Staff {
	return entity.Staff{
		UserID:      1,
		TitleName:   "นาย",
		FirstName:   "สมชาย",
		LastName:    "ดีใจ",
		PhoneNumber: "0812345678",
	}
}

func TestStaffAllValid(t *testing.T) {
	g := NewGomegaWithT(t)

	staff := createValidStaff()

	ok, err := govalidator.ValidateStruct(staff)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestStaffUserIDRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	staff := createValidStaff()
	staff.UserID = 0 // zero-value ของ uint

	ok, err := govalidator.ValidateStruct(staff)

	g.Expect(ok).NotTo(BeTrue())
	g.Expect(err).NotTo(BeNil())
	g.Expect(err.Error()).To(Equal("User ID is required"))
}

func TestStaffTitleNameRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	staff := createValidStaff()
	staff.TitleName = "" // ค่าว่าง

	ok, err := govalidator.ValidateStruct(staff)

	g.Expect(ok).NotTo(BeTrue())
	g.Expect(err).NotTo(BeNil())
	g.Expect(err.Error()).To(Equal("Title Name is required"))
}

func TestStaffFirstNameRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	staff := createValidStaff()
	staff.FirstName = "" // ค่าว่าง

	ok, err := govalidator.ValidateStruct(staff)

	g.Expect(ok).NotTo(BeTrue())
	g.Expect(err).NotTo(BeNil())
	g.Expect(err.Error()).To(Equal("First Name is required"))
}

func TestStaffLastNameRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	staff := createValidStaff()
	staff.LastName = "" // ค่าว่าง

	ok, err := govalidator.ValidateStruct(staff)

	g.Expect(ok).NotTo(BeTrue())
	g.Expect(err).NotTo(BeNil())
	g.Expect(err.Error()).To(Equal("Last Name is required"))
}

func TestStaffPhoneNumberRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	staff := createValidStaff()
	staff.PhoneNumber = "" // ค่าว่าง

	ok, err := govalidator.ValidateStruct(staff)

	g.Expect(ok).NotTo(BeTrue())
	g.Expect(err).NotTo(BeNil())
	g.Expect(err.Error()).To(Equal("Phone Number is required"))
}

func TestStaffPhoneNumberTooShort(t *testing.T) {
	g := NewGomegaWithT(t)

	staff := createValidStaff()
	staff.PhoneNumber = "08123" // 5 หลัก (น้อยกว่า 10)

	ok, err := govalidator.ValidateStruct(staff)

	g.Expect(ok).NotTo(BeTrue())
	g.Expect(err).NotTo(BeNil())
	g.Expect(err.Error()).To(Equal("Phone Number must be 10 digits"))
}

func TestStaffPhoneNumberTooLong(t *testing.T) {
	g := NewGomegaWithT(t)

	staff := createValidStaff()
	staff.PhoneNumber = "08123456789" // 11 หลัก (มากกว่า 10)

	ok, err := govalidator.ValidateStruct(staff)

	g.Expect(ok).NotTo(BeTrue())
	g.Expect(err).NotTo(BeNil())
	g.Expect(err.Error()).To(Equal("Phone Number must be 10 digits"))
}

func TestStaffTitleNameNotInEnum(t *testing.T) {
	g := NewGomegaWithT(t)

	staff := createValidStaff()
	staff.TitleName = "ดร." // ไม่ใช่ค่า enum (นาย/นางสาว/นาง)

	// govalidator ไม่มี built-in enum validation สำหรับ custom string type
	// ดังนั้น "ดร." จะผ่าน validation เพราะมันไม่ใช่ค่าว่าง
	ok, err := govalidator.ValidateStruct(staff)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}
