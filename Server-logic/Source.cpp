#include <iostream>
using namespace std;

#define ENGINE_POWER 100000
#define TAKEOFF_SPEED 140
#define MASS_WITHOUT_CARRIAGE 35000
#define TIME_GIVEN 60.00000
#define MAX_MASS 7857.14 //maximum mass allowed to stay in time given

#define a(F, m) (F / m) //acceleration
#define V(a, t) (a * t) //velocity
#define X(a, t) (0.5 * a * t*t) //distance
#define t(V, a) (V / a) //time

void calculator(const float carriage_mass, float* distance_calculated, float* time_calculated, float* overloaded_mass);

int main()
{
	float mass = 70; //full plane mass
	float distance = 0, time = 0, overload = 0;
	calculator(mass, &distance, &time, &overload);
	cout << distance << " | " << time << " | " << overload;
	return 0;
}

void calculator(const float carriage_mass, float* distance_calculated , float* time_calculated, float* overloaded_mass)
{

	if(carriage_mass == NULL || distance_calculated == NULL || time_calculated == NULL || overloaded_mass == NULL) //checking input 
		return;
	float mass = carriage_mass + MASS_WITHOUT_CARRIAGE; //full plane mass
	float acceleration = a(ENGINE_POWER, mass);
	*time_calculated = t(TAKEOFF_SPEED, acceleration);
	*distance_calculated = X(acceleration, *time_calculated);
	if (*time_calculated > TIME_GIVEN)
		*overloaded_mass = carriage_mass - MAX_MASS;
	return;


}
