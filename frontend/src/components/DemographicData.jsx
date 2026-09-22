import { ProfileForm } from './ProfileForm'

const DemographicData = () => {
    const {
        profile, result, loading, errors, handleProfileChance,
        handleSubmit, resetForm
    } = useCisnerosForm();

    if (result) {
        return (
            <div className="container">
                <EvaluationResults result={result} onReset={resetForm} />
            </div>
        );
    }

    return (
    <div className="container">
      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <ProfileForm
            profile={profile}
            errors={errors}
            onChange={handleProfileChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
       </div>
    </div>
    );
};

export default DemographicData;