import { Formik } from 'formik';
import { Link } from 'react-router';
import React from 'react';
import Yup from 'yup';
import { ZXCVBN_USER_INPUTS } from 'constants/ZxcvbnInputs';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';

import { trackEvent, trackFbEvent } from 'utils/tracking';

import {
  Alert,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
  InputGroup,
  Checkbox,
} from 'react-bootstrap';
import Select from 'react-select';

// values of account type field
const ACCOUNT_TYPE_PRIVATE = 'Private';
const ACCOUNT_TYPE_TEAM = 'Team';

/* eslint-disable react/no-multi-comp */
// constructing validation rules
const formikEnhancer = Formik({
  validationSchema: Yup.object().shape({
    user_name: Yup.string().required('Please provide your name'),
    company_name: Yup.string(),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Please provide password')
      .test(
        'password-zxcvbn',
        'This password is too easy to guess',
        async function(password) {
          // don't allow to provide `CrossCloud` or similar strings and also
          // the email address of the user
          const userInputs = [...ZXCVBN_USER_INPUTS];
          if (this.parent.email) {
            userInputs.push(this.parent.email);
          }
          const zxcvbn = await getZxcvbn();
          const passwordCheckResult = zxcvbn(password, userInputs);
          if (passwordCheckResult.score >= 3) {
            return true;
          }
          if (passwordCheckResult.feedback.warning) {
            return this.createError({
              message: passwordCheckResult.feedback.warning,
            });
          }
          return false;
        }
      )
      .min(8, 'Password should have at least ${min} chars'), // eslint-disable-line no-template-curly-in-string
    accept_terms: Yup.boolean().oneOf(
      [true],
      'You have to accept the crosscloud terms'
    ),
  }),

  mapPropsToValues: ({ userData }) => userData,

  handleSubmit: async (
    data,
    { isSubmitting, props, setErrors, setSubmitting }
  ) => {
    if (isSubmitting) {
      return;
    }
    const { setNetworkError } = props;
    setNetworkError(false);

    // `accept_terms` is used client-only - don't sent it to the server
    const { accept_terms, ...rest } = data;

    let response;
    try {
      response = await fetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(rest),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      setNetworkError(true);
      setSubmitting(false);
      return;
    }

    if (response.ok) {
      // track analytics events
      trackEvent('Signup-Funnel', 'Account created');
      trackFbEvent('Lead');

      const responseJson = await response.json();
      props.authStore.authenticateWithToken(responseJson.token);
      props.router.replace('/');
      return;
    }

    if (response.status === 422) {
      const responseJson = await response.json();
      setErrors(responseJson.errors);
    } else {
      setNetworkError(true);
    }

    setSubmitting(false);
  },

  validateOnChange: true,
});

/**
 * the basic registration form used in the registration page
 */
@observer
class RegistrationFormBase extends React.Component {
  // indicates if a business/team account
  // eslint-disable-next-line react/sort-comp
  @observable accountTypeBusiness = false;

  componentDidMount() {
    // preload zxcvbn library
    getZxcvbn();
  }

  /**
   * deriving validation state of item based on state of parent
   * it touched and validation state is error -> error, else success
   */
  getValidationState(field) {
    const { errors, touched } = this.props;
    if (touched[field]) {
      if (errors[field]) {
        return 'error';
      }

      return 'success';
    }

    return null;
  }

  /**
   * handles changes on forms during the registration
   */
  handleChange = event => {
    // calling parent change handler
    this.props.handleChange(event);

    // marking elements as touched
    // note: it has to be done inside of setTimeout callback,
    // otherwise the validation doesn't start immediately
    setTimeout(() => {
      this.props.setFieldTouched(event.target.name, true);
    });
  };

  /**
   * handles changes on checkboxes
   */
  handleCheckboxChange = event => {
    const { name } = event.target;

    // setting value of a field
    this.props.setFieldValue(name, event.target.checked);

    // marking elements as touched
    // note: it has to be done inside of setTimeout callback,
    // otherwise the validation doesn't start immediately
    setTimeout(() => {
      this.props.setFieldTouched(name, true);
    });
  };

  /**
   * handles changes in the business status 
   * of a user while registering
   * @param newAccountType the newly set account type
   */
  @action
  handleAccountTypeChanged = newAccountType => {
    // setting if account type value and if is business
    this.accountTypeBusiness =
      newAccountType &&
      newAccountType.value &&
      newAccountType.value === ACCOUNT_TYPE_TEAM;
  };

  /**
   * sub-render method for checkbox
   * @param name - name of the field
   * @param label - label for the checkbox to be displayed to the user
   */
  renderCheckbox({ name, label }) {
    // getting errors and state from parent
    const { errors, touched, values } = this.props;
    const error = errors[name];
    // convert value to boolean (to ensure null/undefined means "not checked")
    const value = !!values[name];
    const validationState = this.getValidationState(name);

    // returning UI Form
    return (
      <FormGroup validationState={validationState}>
        <InputGroup>
          <Checkbox
            checked={value}
            name={name}
            onChange={this.handleCheckboxChange}
          >
            {label}
          </Checkbox>
        </InputGroup>
        <FormControl.Feedback />
        {touched[name] &&
          error &&
          <HelpBlock>
            {error}
          </HelpBlock>}
      </FormGroup>
    );
  }

  /**
   * sub-render method for fields
   * @param icon font awesome id of icon to be displayed next to field
   * @param name name of the field
   * @param lable label for the field to be displayed to the user
   * @param type boostrap type of the input field (password, etc.) defaults to text
   */
  renderField({ icon, name, label, type }) {
    // getting errors and state from parent
    const { errors, touched, values } = this.props;
    const error = errors[name];
    const value = values[name];
    const validationState = this.getValidationState(name);

    // returning UI Form
    return (
      <FormGroup validationState={validationState}>
        <ControlLabel>
          {label}
        </ControlLabel>
        <InputGroup>
          <InputGroup.Addon>
            <i className={`fa fa-${icon}`} />
          </InputGroup.Addon>
          <FormControl
            type={type || 'text'}
            name={name}
            value={value}
            onChange={this.handleChange}
          />
        </InputGroup>
        <FormControl.Feedback />
        {touched[name] &&
          error &&
          <HelpBlock>
            {error}
          </HelpBlock>}
      </FormGroup>
    );
  }

  /**
   * renders the account type form of the 
   * registration (private, team, etc.)
   */
  renderAccountTypeSelect = () => {
    // building options for the select based on constants for account types
    const options = [
      { value: ACCOUNT_TYPE_PRIVATE, label: ACCOUNT_TYPE_PRIVATE },
      { value: ACCOUNT_TYPE_TEAM, label: ACCOUNT_TYPE_TEAM },
    ];

    // returning UI
    return (
      <FormGroup>
        <ControlLabel>Account Type</ControlLabel>
        <InputGroup>
          <InputGroup.Addon>
            <i className={'fa fa-toggle-on'} />
          </InputGroup.Addon>
          <Select
            onChange={this.handleAccountTypeChanged}
            options={options}
            value={
              this.accountTypeBusiness
                ? ACCOUNT_TYPE_TEAM
                : ACCOUNT_TYPE_PRIVATE
            }
            clearable={false}
            searchable={false}
          />
        </InputGroup>
        <FormControl.Feedback />
      </FormGroup>
    );
  };

  render() {
    const { hadNetworkError, handleSubmit, isSubmitting } = this.props;

    // setting label of button dependent on registration state
    const registerButtonText = isSubmitting
      ? 'Loading …'
      : 'Start now for free';

    // defining subject of accept terms based on if team of private (as in TOS)
    const acceptTermsSubject = this.accountTypeBusiness ? 'We' : 'I';

    return (
      <form onSubmit={handleSubmit}>
        <div className="panel-heading">
          <h2>Create Account</h2> <br />
        </div>
        <div className="panel-body">
          {hadNetworkError &&
            <Alert bsStyle="danger">
              A network error occurred. Try again later.
            </Alert>}
          {this.renderField({
            icon: 'user',
            name: 'user_name',
            label: 'Full Name',
          })}
          {this.renderAccountTypeSelect()}
          {this.accountTypeBusiness &&
            this.renderField({
              icon: 'users',
              name: 'company_name',
              label: 'Company Name',
            })}
          {this.renderField({
            icon: 'envelope',
            name: 'email',
            label: 'Email',
          })}
          {this.renderField({
            icon: 'lock',
            name: 'password',
            label: 'Password',
            type: 'password',
          })}
          {this.renderCheckbox({
            name: 'accept_terms',
            label: (
              <span>
                {`${acceptTermsSubject} accept the crosscloud `}
                <a href="https://crosscloud.io/terms.pdf" target="_blank">
                  terms
                </a>
              </span>
            ),
          })}
          <div className="form-group mb-n">
            <div className="col-xs-12">
              Already use crosscloud? &nbsp;
              <Link to="/login">Log in.</Link>
            </div>
          </div>
        </div>
        <div className="panel-footer">
          <div className="clearfix">
            <button
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
            >
              {registerButtonText}
            </button>
          </div>
        </div>
      </form>
    );
  }
}

const RegistrationForm = formikEnhancer(RegistrationFormBase);
export default RegistrationForm;

function getZxcvbn() {
  return new Promise(resolve => {
    require.ensure([], require => {
      const zxcvbn = require('zxcvbn');
      resolve(zxcvbn);
    });
  });
}
