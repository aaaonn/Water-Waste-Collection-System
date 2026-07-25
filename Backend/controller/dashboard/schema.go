package dashboard

type DashboardStatsResponse struct {
	RevenueCollected string               `json:"revenueCollected"`
	RevenueTotal     string               `json:"revenueTotal"`
	HouseholdsPaid   string               `json:"householdsPaid"`
	HouseholdsActive string               `json:"householdsActive"`
	HouseholdsTotal  string               `json:"householdsTotal"`
	PendingTasks     int                  `json:"pendingTasks"`
	TotalTasks       int                  `json:"totalTasks"`
	SystemAlerts     int                  `json:"systemAlerts"`
	WaterProgress    ProgressData         `json:"waterProgress"`
	GarbageProgress  ProgressData         `json:"garbageProgress"`
	SurveyProgress   SurveyProgressData   `json:"surveyProgress"`
	ChartData        []MonthlyRevenueData `json:"chartData"`
}

type ProgressData struct {
	Percentage int     `json:"percentage"`
	Target     float64 `json:"target"`
	Collected  float64 `json:"collected"`
}

type MonthlyRevenueData struct {
	Month   string  `json:"month"`
	Water   float64 `json:"water"`   // ความสูงของกราฟเปอร์เซ็นต์ (0-100)
	Garbage float64 `json:"garbage"` // ความสูงของกราฟเปอร์เซ็นต์ (0-100)
}

type SurveyProgressData struct {
	TotalActive int `json:"totalActive"`
	Surveyed    int `json:"surveyed"`
	Unsurveyed  int `json:"unsurveyed"`
	Percentage  int `json:"percentage"`
}
