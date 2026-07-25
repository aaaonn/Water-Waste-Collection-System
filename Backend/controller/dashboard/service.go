package dashboard

type DashboardService interface {
	GetStats(subdistrictID uint, month int, year int, villageID uint) (*DashboardStatsResponse, error)
}

type dashboardService struct {
	repo DashboardRepository
}

func NewDashboardService(r DashboardRepository) DashboardService {
	return &dashboardService{repo: r}
}

func (s *dashboardService) GetStats(subdistrictID uint, month int, year int, villageID uint) (*DashboardStatsResponse, error) {
	return s.repo.GetStatsBySubdistrict(subdistrictID, month, year, villageID)
}
